"use strict";

// The shelf is already in the page. This file only opens and closes a book.
var PULL_MS = 430;
var PULL_EASE = "ease-in-out";

function prefersReducedMotion() {
  return typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function shelfCoverPose(book) {
  var frame = book.querySelector(".cover-frame");
  if (!frame) return null;
  var rect = frame.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    lean: "0deg",
    yaw: "0deg"
  };
}

function jacketSize(naturalWidth, naturalHeight) {
  var width = naturalWidth;
  var height = naturalHeight;
  if (!(width > 1) || !(height > 1)) return null;
  var viewportW = window.innerWidth || 360;
  var viewportH = window.innerHeight || 640;
  var wide = viewportW >= 720;
  var cardInner = Math.max(140, Math.min(wide ? 736 : 352, viewportW - 28) - (wide ? 48 : 36));
  var maxW = Math.min(wide ? 300 : 240, viewportW * (wide ? 0.34 : 0.68), wide ? 300 : cardInner);
  var maxH = Math.min(wide ? viewportH * 0.68 : viewportH * 0.42, wide ? 540 : 420);
  var ratio = width / height;
  var boxW = maxW;
  var boxH = boxW / ratio;
  if (boxH > maxH) {
    boxH = maxH;
    boxW = boxH * ratio;
  }
  return {
    width: Math.max(1, Math.round(boxW)),
    height: Math.max(1, Math.round(boxH))
  };
}

function intrinsicBox(img) {
  if (!img) return null;
  var width = img.naturalWidth > 1 ? img.naturalWidth : Number(img.getAttribute("width"));
  var height = img.naturalHeight > 1 ? img.naturalHeight : Number(img.getAttribute("height"));
  return jacketSize(width, height);
}

function elementPose(el) {
  if (!el) return null;
  var rect = el.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return null;
  return {
    left: rect.left,
    top: rect.top,
    width: rect.width,
    height: rect.height,
    lean: "0deg",
    yaw: "0deg"
  };
}

// CSS ease-in-out is cubic-bezier(0.42, 0, 0.58, 1). Sampled flyer frames use this
// so the cover still eases over 430ms without a layout animation.
function easeInOut(x) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  var x1 = 0.42;
  var y1 = 0;
  var x2 = 0.58;
  var y2 = 1;
  function curve(t, a, b) {
    var u = 1 - t;
    return 3 * u * u * t * a + 3 * u * t * t * b + t * t * t;
  }
  function slope(t, a, b) {
    var u = 1 - t;
    return 3 * u * u * a + 6 * u * t * (b - a) + 3 * t * t * (1 - b);
  }
  var t = x;
  var i;
  for (i = 0; i < 8; i++) {
    var dx = curve(t, x1, x2) - x;
    var d = slope(t, x1, x2);
    if (Math.abs(d) < 1e-6) break;
    t = t - dx / d;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
  }
  return curve(t, y1, y2);
}

function mixBox(from, to, progress) {
  return {
    left: mix(from.left, to.left, progress),
    top: mix(from.top, to.top, progress),
    width: Math.max(1, mix(from.width, to.width, progress)),
    height: Math.max(1, mix(from.height, to.height, progress)),
    lean: "0deg",
    yaw: "0deg"
  };
}

function stateTransform(state) {
  return "translate(" + state.dx.toFixed(2) + "px, " + state.dy.toFixed(2) + "px) scale(" + state.s.toFixed(4) + ")";
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function mixState(from, to, progress) {
  return {
    dx: mix(from.dx, to.dx, progress),
    dy: mix(from.dy, to.dy, progress),
    s: mix(from.s, to.s, progress),
    opacity: mix(from.opacity, to.opacity, progress)
  };
}

// The jacket center starts on the shelf cover and eases to its resting spot,
// with the whole card scaling around that image.
function growthState(detail, shown, shelfPose) {
  var card = detail.getBoundingClientRect();
  var img = shown.getBoundingClientRect();
  if (card.width < 1 || card.height < 1 || img.width < 1 || img.height < 1 || !shelfPose) return null;
  var originX = ((img.left + img.width / 2) - card.left) / card.width * 100;
  var originY = ((img.top + img.height / 2) - card.top) / card.height * 100;
  originX = Math.max(0, Math.min(100, originX));
  originY = Math.max(0, Math.min(100, originY));
  var scale = shelfPose.width / img.width;
  if (!(scale > 0)) scale = 0.82;
  scale = Math.max(0.08, Math.min(1, scale));
  return {
    origin: originX.toFixed(2) + "% " + originY.toFixed(2) + "%",
    from: {
      dx: (shelfPose.left + shelfPose.width / 2) - (img.left + img.width / 2),
      dy: (shelfPose.top + shelfPose.height / 2) - (img.top + img.height / 2),
      s: scale,
      opacity: 0
    },
    rest: { dx: 0, dy: 0, s: 1, opacity: 1 }
  };
}

function currentGrowth(detail) {
  var growth = detail._growth;
  if (!growth) return { dx: 0, dy: 0, s: 1, opacity: 1 };
  var progress = 1;
  var anim = detail._motion;
  if (anim && anim.playState === "running" && anim.effect) {
    var timing = anim.effect.getComputedTiming();
    progress = typeof timing.progress === "number" ? timing.progress : 0;
  }
  return mixState(growth.from, growth.to, progress);
}

function clearMotion(detail) {
  if (!detail) return;
  if (detail._motion) {
    detail._motion.onfinish = null;
    detail._motion = null;
  }
  // onfinish drops _motion without cancelling, and fill keeps that finished
  // effect. The next open would measure the card through it.
  var anims = typeof detail.getAnimations === "function" ? detail.getAnimations() : [];
  var i;
  for (i = 0; i < anims.length; i++) anims[i].cancel();
  detail._growth = null;
  detail.style.transform = "";
  detail.style.opacity = "";
  detail.style.transformOrigin = "";
}

function playGrowth(detail, from, to, done) {
  if (detail._motion) {
    detail._motion.onfinish = null;
    detail._motion.cancel();
    detail._motion = null;
  }
  detail.style.opacity = String(from.opacity);
  detail.style.transform = stateTransform(from);
  var anim = detail.animate([
    { opacity: from.opacity, transform: stateTransform(from) },
    { opacity: to.opacity, transform: stateTransform(to) }
  ], { duration: PULL_MS, easing: PULL_EASE, fill: "both" });
  detail._motion = anim;
  detail._growth = { from: from, to: to };
  anim.onfinish = function () {
    if (detail._motion !== anim) return;
    detail._motion = null;
    if (to.opacity === 1 && to.s === 1 && to.dx === 0 && to.dy === 0) {
      detail.style.opacity = "";
      detail.style.transform = "";
    }
    if (done) done();
  };
  return anim;
}

function intrinsicSize(src) {
  var imgs = document.querySelectorAll("img.cover, img.jacket-img");
  var i, img, width, height;
  for (i = 0; i < imgs.length; i++) {
    img = imgs[i];
    if ((img.getAttribute("src") || "") !== src) continue;
    width = img.naturalWidth > 1 ? img.naturalWidth : Number(img.getAttribute("width"));
    height = img.naturalHeight > 1 ? img.naturalHeight : Number(img.getAttribute("height"));
    if (width > 1 && height > 1) return { width: width, height: height };
  }
  return null;
}

// object-fit:cover source rectangle, as fractions of the image.
function coverFrame(box, image) {
  var scale = Math.max(box.width / image.width, box.height / image.height);
  var dispW = image.width * scale;
  var dispH = image.height * scale;
  return {
    left: ((dispW - box.width) / 2) / dispW,
    top: ((dispH - box.height) / 2) / dispH,
    width: box.width / dispW,
    height: box.height / dispH
  };
}

// The flyer keeps one layout box (the full jacket). Clip and transform place the
// same object-fit:cover crop the old left/top/width/height animation painted.
function flyerMotion(box, image, stageW, stageH) {
  var frame = coverFrame(box, image);
  var visW = frame.width * stageW;
  var scale = box.width / visW;
  var tx = (box.left + box.width / 2) - stageW / 2;
  var ty = (box.top + box.height / 2) - stageH / 2;
  var top = frame.top * 100;
  var right = (1 - frame.left - frame.width) * 100;
  var bottom = (1 - frame.top - frame.height) * 100;
  var left = frame.left * 100;
  var radius = 2 / scale;
  return {
    transform: "translate(" + tx.toFixed(2) + "px, " + ty.toFixed(2) + "px) scale(" + scale.toFixed(4) + ")",
    clipPath: "inset(" + top.toFixed(3) + "% " + right.toFixed(3) + "% " + bottom.toFixed(3) + "% " + left.toFixed(3) + "% round " + radius.toFixed(2) + "px)"
  };
}

function flyCover(src, from, to, done) {
  if (!src || !from || !to || prefersReducedMotion() || typeof Element.prototype.animate !== "function") {
    if (done) done();
    return null;
  }
  var image = intrinsicSize(src);
  var stage = image ? jacketSize(image.width, image.height) : null;
  if (!image || !stage) {
    if (done) done();
    return null;
  }
  var flyer = document.createElement("img");
  flyer.className = "cover-flyer";
  flyer.alt = "";
  flyer.src = src;
  flyer.style.left = "0px";
  flyer.style.top = "0px";
  flyer.style.width = stage.width + "px";
  flyer.style.height = stage.height + "px";
  flyer.style.transformOrigin = "center center";
  flyer.style.objectFit = "fill";
  flyer.style.borderRadius = "0";
  var steps = 16;
  var frames = [];
  var i, box, motion;
  for (i = 0; i <= steps; i++) {
    box = mixBox(from, to, easeInOut(i / steps));
    motion = flyerMotion(box, image, stage.width, stage.height);
    frames.push({ offset: i / steps, easing: "linear", transform: motion.transform, clipPath: motion.clipPath });
  }
  flyer.style.transform = frames[0].transform;
  flyer.style.clipPath = frames[0].clipPath;
  document.body.appendChild(flyer);
  var anim = flyer.animate(frames, { duration: PULL_MS, easing: "linear", fill: "both" });
  var handle = { flyer: flyer, anim: anim, cancelled: false };
  handle.visiblePose = function () {
    var timing = anim.effect && anim.effect.getComputedTiming();
    var t = timing && typeof timing.progress === "number" ? timing.progress : (anim.playState === "finished" ? 1 : 0);
    return mixBox(from, to, easeInOut(t));
  };
  anim.onfinish = function () {
    if (handle.cancelled) return;
    flyer.remove();
    if (done) done();
  };
  return handle;
}

function armLaterCovers(root) {
  var covers = root.querySelectorAll("img.cover[data-src]");
  if (!covers.length) return;
  var i;
  function isShelf(img) {
    var frame = img.closest(".cover-frame");
    return !!(frame && frame.classList.contains("has-shelf"));
  }
  function reveal(img) {
    if (isShelf(img)) return;
    var src = img.getAttribute("data-src");
    if (!src || img.getAttribute("src")) return;
    img.src = src;
  }
  function promote(img) {
    if (isShelf(img)) return;
    img.setAttribute("fetchpriority", "high");
    img.setAttribute("loading", "eager");
    reveal(img);
  }
  var vh = window.innerHeight || 0;
  var urgent = [];
  for (i = 0; i < covers.length; i++) {
    var rect = covers[i].getBoundingClientRect();
    if (rect.width > 0 && rect.bottom > 0 && rect.top < vh && !isShelf(covers[i])) {
      promote(covers[i]);
      urgent.push(covers[i]);
    }
  }
  if (typeof IntersectionObserver === "function") {
    var watch = new IntersectionObserver(function (entries) {
      var n;
      for (n = 0; n < entries.length; n++) {
        if (!entries[n].isIntersecting) continue;
        var box = entries[n].target.getBoundingClientRect();
        if (box.width < 1 || box.bottom <= 0 || box.top >= (window.innerHeight || 0)) continue;
        promote(entries[n].target);
        watch.unobserve(entries[n].target);
      }
    });
    for (i = 0; i < covers.length; i++) {
      if (!covers[i].getAttribute("src") && !isShelf(covers[i])) watch.observe(covers[i]);
    }
  }
  var left = 1 + urgent.length;
  var released = false;
  function release() {
    if (released) return;
    left -= 1;
    if (left > 0) return;
    released = true;
    for (i = 0; i < covers.length; i++) reveal(covers[i]);
  }
  for (i = 0; i < urgent.length; i++) {
    if (urgent[i].complete && urgent[i].naturalWidth > 0) release();
    else {
      urgent[i].addEventListener("load", release);
      urgent[i].addEventListener("error", release);
    }
  }
  var sprite = new Image();
  sprite.onload = release;
  sprite.onerror = function () {
    var tops = root.querySelectorAll(".has-shelf img.cover");
    var n;
    for (n = 0; n < tops.length; n++) {
      var src = tops[n].getAttribute("data-src");
      if (src && !tops[n].getAttribute("src")) tops[n].src = src;
    }
    release();
  };
  sprite.src = "covers/shelf-top.jpg";
}

function boot() {
  var root = document.getElementById("shelves");
  var scrim = document.getElementById("scrim");
  var layer = document.getElementById("pull-layer");
  if (!root || !layer) return;

  var open = null;
  var flight = null;
  var pullGen = 0;
  var dismissLock = false;
  var dismissTimer = 0;
  var cards = root.querySelectorAll(".book");
  var i;

  for (i = 0; i < cards.length; i++) {
    cards[i]._pull = cards[i].querySelector(".pull");
    cards[i]._detail = cards[i].querySelector(".detail");
    var cover = cards[i].querySelector(".cover");
    if (cover) {
      cover.addEventListener("error", function () {
        var pending = this.getAttribute("data-src");
        if (pending && this.getAttribute("src") !== pending) return;
        this.remove();
      });
    }
  }

  armLaterCovers(root);

  function clearFlight() {
    if (!flight) return null;
    var pose = flight.visiblePose ? flight.visiblePose() : null;
    if (!pose) {
      var rect = flight.flyer.getBoundingClientRect();
      pose = {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        lean: "0deg",
        yaw: "0deg"
      };
    }
    flight.cancelled = true;
    if (flight.anim) flight.anim.cancel();
    flight.flyer.remove();
    flight = null;
    return pose;
  }

  function settleDetail(book) {
    var detail = book._detail;
    if (!detail) return;
    detail.hidden = true;
    detail.classList.remove("is-open", "is-closing");
    clearMotion(detail);
    var img = detail.querySelector(".jacket-img");
    var plate = detail.querySelector(".jacket-plate");
    if (img) img.classList.remove("is-flying");
    if (plate) plate.classList.remove("is-flying");
    if (book._pull && detail.parentNode !== book._pull) book._pull.appendChild(detail);
  }

  function fadeScrim(to) {
    if (!scrim) return;
    if (scrim._fade) {
      scrim._fade.onfinish = null;
      scrim._fade.cancel();
      scrim._fade = null;
    }
    if (prefersReducedMotion() || typeof Element.prototype.animate !== "function") {
      scrim.classList.toggle("is-shown", to === 1);
      scrim.hidden = to === 0;
      scrim.style.opacity = "";
      return;
    }
    var from = 0;
    if (!scrim.hidden) {
      var current = parseFloat(getComputedStyle(scrim).opacity);
      if (current >= 0) from = current;
    }
    scrim.hidden = false;
    var anim = scrim.animate(
      [{ opacity: from }, { opacity: to }],
      { duration: PULL_MS, easing: "ease-out", fill: "both" }
    );
    if (document.timeline && typeof document.timeline.currentTime === "number") {
      anim.startTime = document.timeline.currentTime;
    }
    scrim._fade = anim;
    scrim._fadeTarget = to;
    anim.onfinish = function () {
      if (scrim._fade !== anim) return;
      scrim._fade = null;
      if (to === 1) scrim.classList.add("is-shown");
      else scrim.classList.remove("is-shown");
      anim.cancel();
      scrim.style.opacity = "";
      if (to === 0) scrim.hidden = true;
    };
  }

  function hideScrim() {
    if (!scrim) return;
    if (scrim._fade && scrim._fade.playState === "running" && scrim._fadeTarget === 0) return;
    if (scrim._fade) {
      scrim._fade.onfinish = null;
      scrim._fade.cancel();
      scrim._fade = null;
    }
    scrim.classList.remove("is-shown");
    scrim.hidden = true;
    scrim.style.opacity = "";
  }

  function coverSrc(book) {
    var img = book.querySelector(".cover");
    if (!img) return "";
    var src = img.getAttribute("src") || img.getAttribute("data-src") || "";
    if (src && !img.getAttribute("src")) {
      img.setAttribute("fetchpriority", "high");
      img.src = src;
    }
    return src;
  }

  function shownJacket(detail, src) {
    var img = detail.querySelector(".jacket-img");
    var plate = detail.querySelector(".jacket-plate");
    if (src && img) {
      var sized = intrinsicBox(img);
      if (sized) {
        img.style.width = sized.width + "px";
        img.style.height = sized.height + "px";
        img.style.maxWidth = "none";
        img.style.maxHeight = "none";
      }
      if (img.getAttribute("src") !== src) img.src = src;
      img.hidden = false;
      if (plate) plate.hidden = true;
      return img;
    }
    if (img) img.hidden = true;
    if (plate) plate.hidden = false;
    return plate;
  }

  function closeBook(immediate) {
    if (!open) return;
    var book = open;
    var detail = book._detail;
    if (detail && detail.classList.contains("is-closing")) return;
    var hit = book.querySelector(".book-hit");
    var bay = book.closest(".bay");
    pullGen += 1;
    var fromFlight = clearFlight();
    var stageOpen = !!(detail && detail.classList.contains("is-open") && !detail.hidden);
    var img = detail ? detail.querySelector(".jacket-img") : null;
    var plate = detail ? detail.querySelector(".jacket-plate") : null;
    var src = img && !img.hidden ? (img.getAttribute("src") || "") : "";
    var shown = src ? img : plate;

    function finish() {
      book.classList.remove("is-pulled", "is-away");
      if (hit) hit.setAttribute("aria-expanded", "false");
      if (bay) bay.classList.remove("has-pulled", "is-dim");
      settleDetail(book);
      if (layer) layer.hidden = true;
      hideScrim();
      document.body.classList.remove("is-detail-open");
      if (open === book) open = null;
    }

    if (immediate || !stageOpen || !detail || prefersReducedMotion()) {
      finish();
      return;
    }

    var visual = fromFlight || (shown ? elementPose(shown) : null);
    var sampled = currentGrowth(detail);
    if (detail._motion) {
      detail._motion.onfinish = null;
      detail._motion = null;
    }
    var lingering = typeof detail.getAnimations === "function" ? detail.getAnimations() : [];
    var ai;
    for (ai = 0; ai < lingering.length; ai++) lingering[ai].cancel();
    detail.style.transform = "none";
    detail.style.opacity = "1";
    if (shown) pinOriginReady(detail, shown);
    var shelf = shelfCoverPose(book);
    var next = shown ? growthState(detail, shown, shelf) : null;
    detail.classList.add("is-closing");
    if (bay) bay.classList.remove("is-dim");
    fadeScrim(0);

    var pending = 0;
    var settled = false;
    function done() {
      pending -= 1;
      if (pending > 0 || settled) return;
      settled = true;
      flight = null;
      finish();
    }

    if (next) {
      detail.style.transformOrigin = next.origin;
      pending += 1;
      var fadeWatch = window.setTimeout(done, PULL_MS + 80);
      playGrowth(detail, sampled, next.from, function () {
        window.clearTimeout(fadeWatch);
        done();
      });
    }

    if (src && visual && shelf) {
      if (shown) shown.classList.add("is-flying");
      pending += 1;
      flight = flyCover(src, visual, shelf, function () {
        flight = null;
        done();
      });
      if (!flight) done();
    }

    if (pending === 0) finish();
  }

  function pinOriginReady(detail, shown) {
    var pose = growthState(detail, shown, { left: 0, top: 0, width: shown.getBoundingClientRect().width, height: 1 });
    if (pose) detail.style.transformOrigin = pose.origin;
  }

  function presentBook(book, gen, src) {
    if (gen !== pullGen || open !== book) return;
    var detail = book._detail;
    if (!detail || !layer) return;
    var fromShelf = shelfCoverPose(book);
    layer.hidden = false;
    layer.appendChild(detail);
    detail.hidden = false;
    detail.classList.remove("is-closing");
    detail.classList.add("is-open");
    book.classList.add("is-away");
    clearMotion(detail);
    var shown = shownJacket(detail, src);
    if (shown) shown.classList.add("is-flying");
    var to = src ? elementPose(shown) : null;
    var growth = shown ? growthState(detail, shown, fromShelf) : null;
    var closeBtn = detail.querySelector(".detail-close");
    if (closeBtn && typeof closeBtn.focus === "function") {
      closeBtn.focus({ preventScroll: true });
    }
    if (prefersReducedMotion() || !growth) {
      if (shown) shown.classList.remove("is-flying");
      return;
    }
    detail.style.transformOrigin = growth.origin;
    playGrowth(detail, growth.from, growth.rest);
    if (!src || !fromShelf || !to) {
      if (shown) shown.classList.remove("is-flying");
      return;
    }
    flight = flyCover(src, fromShelf, to, function () {
      flight = null;
      if (gen !== pullGen) return;
      if (shown) shown.classList.remove("is-flying");
    });
    if (!flight && shown) shown.classList.remove("is-flying");
  }

  function openBook(book) {
    if (open || dismissLock) return;
    pullGen += 1;
    var gen = pullGen;
    var hit = book.querySelector(".book-hit");
    book.classList.add("is-pulled");
    if (hit) hit.setAttribute("aria-expanded", "true");
    var bay = book.closest(".bay");
    if (bay) bay.classList.add("has-pulled", "is-dim");
    document.body.classList.add("is-detail-open");
    if (layer) layer.hidden = false;
    fadeScrim(1);
    open = book;
    presentBook(book, gen, coverSrc(book));
  }

  function isCloseControl(target) {
    return !!(target && target.closest && target.closest("[data-close-detail]"));
  }

  function isInsideOpenDetail(target) {
    return !!(open && open._detail && target && open._detail.contains(target) && !isCloseControl(target));
  }

  function armDismiss() {
    dismissLock = true;
    window.clearTimeout(dismissTimer);
    dismissTimer = window.setTimeout(function () {
      dismissLock = false;
    }, 500);
  }

  function dismissOpen(event) {
    if (!open) return false;
    if (isInsideOpenDetail(event.target)) return false;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
    if (!dismissLock) {
      armDismiss();
      closeBook(false);
    }
    return true;
  }

  document.addEventListener("pointerdown", function (event) {
    if (!open || isInsideOpenDetail(event.target)) return;
    if (event.cancelable) event.preventDefault();
    event.stopPropagation();
  }, { capture: true, passive: false });

  document.addEventListener("pointerup", function (event) {
    if (!open) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dismissOpen(event);
  }, true);

  document.addEventListener("click", function (event) {
    if (dismissLock) {
      dismissLock = false;
      window.clearTimeout(dismissTimer);
      if (event.cancelable) event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (open) {
      dismissOpen(event);
      return;
    }
    var hit = event.target.closest && event.target.closest(".book-hit");
    if (!hit || !root.contains(hit)) return;
    var book = hit.closest(".book");
    if (!book) return;
    event.preventDefault();
    openBook(book);
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape" || !open) return;
    var hit = open.querySelector(".book-hit");
    closeBook(false);
    if (hit) hit.focus();
  });

  window.addEventListener("resize", function () {
    if (!open || !open._detail) return;
    clearFlight();
    var img = open._detail.querySelector(".jacket-img");
    if (!img || img.hidden) return;
    var sized = intrinsicBox(img);
    if (!sized) return;
    img.style.width = sized.width + "px";
    img.style.height = sized.height + "px";
    img.style.maxWidth = "none";
    img.style.maxHeight = "none";
    img.classList.remove("is-flying");
    clearMotion(open._detail);
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
