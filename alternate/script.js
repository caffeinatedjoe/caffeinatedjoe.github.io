"use strict";

// The shelf is already in the page. This file opens and closes a book,
// and filters that shelf by title or author.
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

function foldTitle(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function bookHit(book, query) {
  if (!query) return true;
  var title = foldTitle(book.getAttribute("data-title"));
  var author = foldTitle(book.getAttribute("data-author"));
  return title.indexOf(query) !== -1 || author.indexOf(query) !== -1;
}

function armFinder(root, cards, hooks) {
  var finder = document.getElementById("finder");
  var input = document.getElementById("finder-input");
  var empty = document.getElementById("finder-empty");
  var toggle = finder ? finder.querySelector(".finder-toggle") : null;
  if (!finder || !input || !toggle || !root) return;

  var filterGen = 0;
  var bays = root.querySelectorAll(".bay");

  function cancelShift(el) {
    if (!el || !el._filterAnim) return;
    el._filterAnim.onfinish = null;
    el._filterAnim.cancel();
    el._filterAnim = null;
  }

  function shown(book) {
    return !book.hidden && !book.classList.contains("is-out");
  }

  function visualOf(el) {
    var rect = el.getBoundingClientRect();
    var opacity = parseFloat(window.getComputedStyle(el).opacity);
    if (!(opacity >= 0)) opacity = 1;
    return {
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      opacity: opacity
    };
  }

  function restore(book) {
    var mark = book._mark;
    if (mark && mark.parentNode) {
      mark.parentNode.insertBefore(book, mark);
      mark.remove();
    }
    book._mark = null;
    book.classList.remove("is-lifted");
  }

  function clearLift(book) {
    book.style.position = "";
    book.style.left = "";
    book.style.top = "";
    book.style.margin = "";
    book.style.zIndex = "";
    book.style.transform = "";
    book.style.opacity = "";
    book.classList.remove("is-lifted");
    book._glide = false;
  }

  function hideBook(book) {
    if (book.classList.contains("is-lifted")) restore(book);
    clearLift(book);
    book.classList.add("is-out");
    book.setAttribute("hidden", "");
  }

  function showBook(book) {
    if (book.classList.contains("is-lifted")) restore(book);
    clearLift(book);
    book.classList.remove("is-out");
    book.removeAttribute("hidden");
  }

  function lift(book, rect) {
    if (!book._mark || !book._mark.parentNode) {
      var mark = document.createComment("");
      if (book.parentNode) book.parentNode.insertBefore(mark, book);
      book._mark = mark;
    }
    if (book.parentNode !== document.body) document.body.appendChild(book);
    book.classList.add("is-lifted");
    book.classList.remove("is-out");
    book.removeAttribute("hidden");
    book.style.position = "fixed";
    book.style.left = rect.left.toFixed(2) + "px";
    book.style.top = rect.top.toFixed(2) + "px";
    book.style.margin = "0";
    book.style.zIndex = "30";
    book.style.transform = "none";
    book.style.opacity = String(rect.opacity);
  }

  // Read once per gesture. innerHeight inside the book loop flushes
  // layout after every hide, and that stall skips the ease on a phone.
  var viewW = 390;
  var viewH = 800;
  function readView() {
    viewW = window.innerWidth || viewW;
    viewH = window.innerHeight || viewH;
  }

  function inView(rect) {
    var pad = 64;
    var right = rect.right == null ? rect.left + rect.width : rect.right;
    var bottom = rect.bottom == null ? rect.top + rect.height : rect.bottom;
    return bottom >= -pad && rect.top <= viewH + pad &&
      right >= -pad && rect.left <= viewW + pad;
  }

  function leaveDy(rect) {
    if (rect.bottom < 0 || rect.top > viewH) return -Math.min(160, rect.height + 48);
    return -rect.top - rect.height - 24;
  }

  function enterDy(rect) {
    if (rect.bottom < 0 || rect.top > viewH) return -Math.min(160, rect.height + 48);
    return -rect.top - rect.height - 24;
  }

  function shiftOf(x, y) {
    return "translate3d(" + x.toFixed(2) + "px, " + y.toFixed(2) + "px, 0)";
  }

  // from -> to on transform only. Fill is cancelled so a finished effect
  // cannot pin the next measurement, same as the detail card.
  function playShift(el, fromX, fromY, toX, toY, opacityFrom, opacityTo, gen, done) {
    var start = { transform: shiftOf(fromX, fromY) };
    var end = { transform: shiftOf(toX, toY) };
    if (opacityFrom !== opacityTo) {
      start.opacity = opacityFrom;
      end.opacity = opacityTo;
    }
    el.style.transform = start.transform;
    if (opacityFrom !== opacityTo) el.style.opacity = String(opacityFrom);
    var anim = el.animate([start, end], { duration: PULL_MS, easing: PULL_EASE, fill: "both" });
    el._filterAnim = anim;
    anim.onfinish = function () {
      if (el._filterAnim !== anim || gen !== filterGen) return;
      el._filterAnim = null;
      anim.cancel();
      el.style.transform = "";
      if (opacityFrom !== opacityTo) el.style.opacity = "";
      if (done) done();
    };
  }

  function syncBays(query) {
    var i, bay, left;
    for (i = 0; i < bays.length; i++) {
      bay = bays[i];
      left = bay.querySelector(".book:not([hidden])");
      bay.classList.toggle("is-empty", !left);
    }
    root.classList.toggle("is-filtering", !!query);
    if (empty) empty.hidden = !query || !!root.querySelector(".bay:not(.is-empty)");
  }

  function applyFilter(raw) {
    settleChrome();
    var query = foldTitle(raw);
    var gen = ++filterGen;
    var reduced = prefersReducedMotion() || typeof Element.prototype.animate !== "function";
    var i;

    if (hooks.dismissUnmatched) hooks.dismissUnmatched(query);

    readView();
    var first = new Map();
    var bayFirst = new Map();
    for (i = 0; i < cards.length; i++) {
      if (!shown(cards[i])) continue;
      var shot = visualOf(cards[i]);
      shot.lifted = cards[i].classList.contains("is-lifted");
      first.set(cards[i], shot);
    }
    for (i = 0; i < bays.length; i++) {
      if (!bays[i].classList.contains("is-empty")) bayFirst.set(bays[i], visualOf(bays[i]));
    }

    releaseGlide();
    first.forEach(function (_, book) { cancelShift(book); });
    bayFirst.forEach(function (_, bay) { cancelShift(bay); });
    first.forEach(function (_, book) {
      book.style.transform = "";
      book.style.opacity = "";
    });
    bayFirst.forEach(function (_, bay) {
      bay.style.transform = "";
    });

    var onPhone = phoneMedia.matches;
    for (i = 0; i < cards.length; i++) {
      var book = cards[i];
      var hit = bookHit(book, query);
      if (hit) showBook(book);
      else if (!reduced && first.has(book) && (!onPhone || inView(first.get(book)))) {
        lift(book, first.get(book));
      } else hideBook(book);
    }
    syncBays(query);

    if (reduced) {
      root.classList.remove("is-settling");
      return;
    }

    var bayNow = new Map();
    var bookNow = new Map();
    var bayShift = new Map();
    for (i = 0; i < bays.length; i++) {
      if (!bays[i].classList.contains("is-empty")) bayNow.set(bays[i], bays[i].getBoundingClientRect());
    }
    for (i = 0; i < cards.length; i++) {
      if (!cards[i].classList.contains("is-lifted") && shown(cards[i])) {
        bookNow.set(cards[i], cards[i].getBoundingClientRect());
      }
    }

    bayFirst.forEach(function (was, bay) {
      var now = bayNow.get(bay);
      if (!now) return;
      var dx = was.left - now.left;
      var dy = was.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      bayShift.set(bay, { dx: dx, dy: dy });
    });

    var pending = 0;
    var settled = false;
    function finished() {
      pending -= 1;
      if (pending > 0 || settled || gen !== filterGen) return;
      settled = true;
      root.classList.remove("is-settling");
    }

    root.classList.add("is-settling");

    bayShift.forEach(function (shift, bay) {
      pending += 1;
      playShift(bay, shift.dx, shift.dy, 0, 0, 1, 1, gen, finished);
    });

    for (i = 0; i < cards.length; i++) {
      var moving = cards[i];
      if (moving.classList.contains("is-lifted")) {
        var from = first.get(moving);
        if (!from) continue;
        pending += 1;
        playShift(moving, 0, 0, 0, leaveDy(from), from.opacity, 0, gen, (function (book) {
          return function () {
            if (gen !== filterGen) return;
            hideBook(book);
            finished();
          };
        })(moving));
        continue;
      }
      if (!shown(moving)) continue;
      var dest = bookNow.get(moving);
      if (!dest) continue;
      var bay = moving.closest(".bay");
      var shift = bay && bayShift.get(bay) ? bayShift.get(bay) : { dx: 0, dy: 0 };
      var seen = first.get(moving);
      var dx;
      var dy;
      var opacityFrom = 1;
      if (seen) {
        dx = seen.left - dest.left - shift.dx;
        dy = seen.top - dest.top - shift.dy;
        if (seen.lifted && seen.opacity < 0.99) opacityFrom = seen.opacity;
      } else {
        dx = -shift.dx;
        dy = enterDy(dest) - shift.dy;
        opacityFrom = 0;
      }
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5 && opacityFrom === 1) continue;
      if (onPhone && !(seen && inView(seen)) && !inView(dest)) continue;
      pending += 1;
      playShift(moving, dx, dy, 0, 0, opacityFrom, 1, gen, finished);
    }

    if (pending === 0) root.classList.remove("is-settling");
  }

  var phoneMedia = window.matchMedia("(max-width: 719px)");
  var chromeAnims = [];
  var pinned = [];
  var slidEls = [];

  function pageEl() {
    return finder.closest(".page");
  }

  function chromeEls() {
    var list = [];
    var mast = document.querySelector(".mast");
    var plates = document.querySelectorAll(".year-plate");
    var i;
    if (mast) list.push(mast);
    for (i = 0; i < plates.length; i++) list.push(plates[i]);
    return list;
  }

  function cancelChromeAnims() {
    var i;
    for (i = 0; i < chromeAnims.length; i++) {
      chromeAnims[i].onfinish = null;
      chromeAnims[i].cancel();
    }
    chromeAnims = [];
  }

  function rememberPin(el) {
    if (pinned.indexOf(el) === -1) pinned.push(el);
  }

  function forgetPin(el) {
    var at = pinned.indexOf(el);
    if (at !== -1) pinned.splice(at, 1);
  }

  function releasePin(el) {
    if (!el) return;
    el.style.position = "";
    el.style.left = "";
    el.style.top = "";
    el.style.width = "";
    el.style.height = "";
    el.style.margin = "";
    el.style.zIndex = "";
    el.style.pointerEvents = "";
    el.style.opacity = "";
    el.style.transform = "";
    if (el._pinMark && el._pinMark.parentNode) {
      el._pinMark.parentNode.insertBefore(el, el._pinMark);
      el._pinMark.remove();
    }
    el._pinMark = null;
    forgetPin(el);
  }

  function clearSlides() {
    var i;
    for (i = 0; i < slidEls.length; i++) {
      slidEls[i].style.transform = "";
      slidEls[i].style.opacity = "";
    }
    slidEls = [];
  }

  function settleChrome() {
    cancelChromeAnims();
    clearSlides();
    root.style.transform = "";
    var els = pinned.slice();
    var i;
    for (i = 0; i < els.length; i++) releasePin(els[i]);
    els = chromeEls();
    for (i = 0; i < els.length; i++) {
      if (els[i]._pinMark) releasePin(els[i]);
    }
  }

  function holdPin(el, box, zIndex) {
    if (!el._pinMark) {
      var mark = document.createComment("");
      if (el.parentNode) el.parentNode.insertBefore(mark, el);
      el._pinMark = mark;
    }
    document.body.appendChild(el);
    el.style.position = "fixed";
    el.style.left = box.left.toFixed(2) + "px";
    el.style.top = box.top.toFixed(2) + "px";
    el.style.width = box.width.toFixed(2) + "px";
    el.style.height = box.height.toFixed(2) + "px";
    el.style.margin = "0";
    el.style.zIndex = String(zIndex || 1);
    el.style.pointerEvents = "none";
    el.style.transform = "translate3d(0px, 0px, 0px)";
    rememberPin(el);
  }

  function pinFade(el, rect, zIndex) {
    var box = rect || el.getBoundingClientRect();
    if (box.width < 1 || box.height < 1) return;
    if (prefersReducedMotion() || typeof el.animate !== "function") return;
    holdPin(el, box, zIndex || 4);
    el.style.opacity = "1";
    var anim = el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: PULL_MS, easing: PULL_EASE, fill: "both" }
    );
    chromeAnims.push(anim);
    anim.onfinish = function () {
      if (chromeAnims.indexOf(anim) === -1) return;
      anim.cancel();
      releasePin(el);
    };
  }

  function dampShift(delta) {
    var cap = 280;
    if (delta > cap) return cap;
    if (delta < -cap) return -cap;
    return delta;
  }

  // Old shelves are pinned, then they drift toward the single shelf and fade.
  // Travel is capped so a far year eases instead of streaking across the page.
  function pinTravel(el, rect, dx, dy) {
    if (!rect || rect.width < 1 || rect.height < 1) return;
    if (prefersReducedMotion() || typeof el.animate !== "function") return;
    holdPin(el, rect, 2);
    el.style.opacity = "1";
    var anim = el.animate(
      [
        { opacity: 1, transform: "translate3d(0px, 0px, 0px)" },
        { opacity: 0, transform: shiftOf(dx, dy) }
      ],
      { duration: PULL_MS, easing: PULL_EASE, fill: "both" }
    );
    chromeAnims.push(anim);
    anim.onfinish = function () {
      if (chromeAnims.indexOf(anim) === -1) return;
      anim.cancel();
      releasePin(el);
    };
  }

  function slideElm(el, fromX, fromY, fromOpacity, toOpacity) {
    if (!el) return;
    if (prefersReducedMotion() || typeof el.animate !== "function") return;
    if (Math.abs(fromX) < 0.5 && Math.abs(fromY) < 0.5 && fromOpacity === toOpacity) return;
    if (slidEls.indexOf(el) === -1) slidEls.push(el);
    el.style.transform = shiftOf(fromX, fromY);
    el.style.opacity = String(fromOpacity);
    var anim = el.animate(
      [
        { transform: shiftOf(fromX, fromY), opacity: fromOpacity },
        { transform: "translate3d(0px, 0px, 0px)", opacity: toOpacity }
      ],
      { duration: PULL_MS, easing: PULL_EASE, fill: "both" }
    );
    chromeAnims.push(anim);
    anim.onfinish = function () {
      if (chromeAnims.indexOf(anim) === -1) return;
      anim.cancel();
      el.style.transform = "";
      el.style.opacity = "";
    };
  }

  function fadeChromeIn(el) {
    if (prefersReducedMotion() || typeof el.animate !== "function") return;
    el.style.opacity = "0";
    var anim = el.animate(
      [{ opacity: 0 }, { opacity: 1 }],
      { duration: PULL_MS, easing: PULL_EASE, fill: "both" }
    );
    chromeAnims.push(anim);
    anim.onfinish = function () {
      if (chromeAnims.indexOf(anim) === -1) return;
      anim.cancel();
      el.style.opacity = "";
    };
  }

  var fieldAnim = null;
  var shelfHost = bays[0] ? bays[0].querySelector(".books") : null;

  function playField(opening) {
    var fromOpacity = opening ? 0 : 1;
    var fromTransform = opening ? "translateX(0.75rem) scale(0.9)" : "none";
    if (fieldAnim) {
      var opacityNow = parseFloat(window.getComputedStyle(input).opacity);
      if (opacityNow >= 0) fromOpacity = opacityNow;
      var transformNow = window.getComputedStyle(input).transform;
      if (transformNow && transformNow !== "none") fromTransform = transformNow;
      fieldAnim.onfinish = null;
      fieldAnim.cancel();
      fieldAnim = null;
    }
    var reduced = prefersReducedMotion() || typeof input.animate !== "function";
    if (reduced) {
      input.hidden = !opening;
      input.style.opacity = "";
      input.style.transform = "";
      return;
    }
    var toOpacity = opening ? 1 : 0;
    var toTransform = opening ? "none" : "translateX(0.75rem) scale(0.9)";
    input.style.opacity = String(fromOpacity);
    input.style.transform = fromTransform;
    if (opening) input.hidden = false;
    var anim = input.animate(
      [
        { opacity: fromOpacity, transform: fromTransform },
        { opacity: toOpacity, transform: toTransform }
      ],
      { duration: PULL_MS, easing: PULL_EASE, fill: "both" }
    );
    fieldAnim = anim;
    anim.onfinish = function () {
      if (fieldAnim !== anim) return;
      fieldAnim = null;
      anim.cancel();
      input.style.opacity = "";
      input.style.transform = "";
      if (!opening) input.hidden = true;
    };
  }

  function ensureHome(book) {
    if (book._homeMark && book._homeMark.parentNode) return;
    if ((!book.parentNode || book.parentNode === document.body) && book._mark && book._mark.parentNode) {
      book._homeMark = book._mark;
      book._mark = null;
      return;
    }
    if (!book.parentNode || book.parentNode === document.body) return;
    var mark = document.createComment("");
    book.parentNode.insertBefore(mark, book);
    book._homeMark = mark;
  }

  function sendHome(book) {
    if (book.classList.contains("is-lifted")) {
      clearLift(book);
      if (book._mark && book._mark.parentNode) book._mark.remove();
      book._mark = null;
    }
    var home = book._homeMark;
    if (home && home.parentNode) {
      home.parentNode.insertBefore(book, home);
      home.remove();
    }
    book._homeMark = null;
  }

  function snapshotShown() {
    var shots = new Map();
    var i;
    for (i = 0; i < cards.length; i++) {
      if (!shown(cards[i])) continue;
      shots.set(cards[i], visualOf(cards[i]));
    }
    return shots;
  }

  function clearBookMotion() {
    var i;
    for (i = 0; i < cards.length; i++) {
      cancelShift(cards[i]);
      if (!cards[i].classList.contains("is-lifted")) {
        cards[i].style.transform = "";
        cards[i].style.opacity = "";
      }
    }
    for (i = 0; i < bays.length; i++) {
      cancelShift(bays[i]);
      bays[i].style.transform = "";
    }
  }

  function glideBooks(shots, gen) {
    readView();
    var pending = 0;
    var settled = false;
    function finished() {
      pending -= 1;
      if (pending > 0 || settled || gen !== filterGen) return;
      settled = true;
      root.classList.remove("is-settling");
    }
    root.classList.add("is-settling");
    var reduced = prefersReducedMotion() || typeof Element.prototype.animate !== "function";
    shots.forEach(function (was, book) {
      if (!shown(book) || reduced) return;
      var now = book.getBoundingClientRect();
      var dx = was.left - now.left;
      var dy = was.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      if (phoneMedia.matches && !inView(was) && !inView(now)) return;
      pending += 1;
      playShift(book, dx, dy, 0, 0, was.opacity < 0.99 ? was.opacity : 1, 1, gen, finished);
    });
    if (pending === 0) root.classList.remove("is-settling");
  }

  function releaseGlide() {
    var i, book;
    for (i = 0; i < cards.length; i++) {
      book = cards[i];
      if (!book._glide) continue;
      cancelShift(book);
      restore(book);
      clearLift(book);
    }
  }

  // Books leave the shelf for the trip so a fading case does not fade them too.
  function glideLoose(shots, gen, preset) {
    var pending = 0;
    var settled = false;
    function finished() {
      pending -= 1;
      if (pending > 0 || settled || gen !== filterGen) return;
      settled = true;
      root.classList.remove("is-settling");
    }
    root.classList.add("is-settling");
    var reduced = prefersReducedMotion() || typeof Element.prototype.animate !== "function";
    shots.forEach(function (was, book) {
      if (!shown(book) || reduced) return;
      var now = preset && preset.get(book) ? preset.get(book) : book.getBoundingClientRect();
      var dx = was.left - now.left;
      var dy = was.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      lift(book, {
        left: now.left,
        top: now.top,
        opacity: was.opacity < 0.99 ? was.opacity : 1
      });
      book.style.zIndex = "3";
      book._glide = true;
      pending += 1;
      playShift(book, dx, dy, 0, 0, was.opacity < 0.99 ? was.opacity : 1, 1, gen, function () {
        if (book._glide && gen === filterGen) {
          restore(book);
          clearLift(book);
        }
        finished();
      });
    });
    if (pending === 0) root.classList.remove("is-settling");
  }

  function shiftCases(origin) {
    readView();
    var i, shelfCase, plate, home, dx, dy;
    if (!origin) return;
    for (i = 0; i < bays.length; i++) {
      plate = bays[i].querySelector(".year-plate");
      shelfCase = bays[i].querySelector(".case");
      if (plate) {
        home = plate.getBoundingClientRect();
        if (home.height > 1 && (!phoneMedia.matches || inView(home))) {
          dx = dampShift(origin.left - home.left);
          dy = dampShift(origin.top - home.top);
          slideElm(plate, dx, dy, 0, 1);
        }
      }
      if (i === 0 || !shelfCase || phoneMedia.matches) continue;
      home = shelfCase.getBoundingClientRect();
      if (home.height < 1) continue;
      dx = dampShift(origin.left - home.left);
      dy = dampShift(origin.top - home.top);
      slideElm(shelfCase, dx, dy, 0, 1);
    }
  }

  // Search is one shelf. Books slide between the year shelves and that shelf
  // on transform only; the wood underneath fades.
  function setSearchMode(opening) {
    if (!shelfHost) return;
    readView();
    var page = pageEl();
    if (opening && hooks.closeDetail) hooks.closeDetail();
    if (opening === root.classList.contains("is-merged")) {
      syncPhoneChrome();
      return;
    }
    var shots = snapshotShown();
    clearBookMotion();
    releaseGlide();
    settleChrome();
    filterGen += 1;
    var gen = filterGen;
    var i;
    var plates = document.querySelectorAll(".year-plate");
    var mast = document.querySelector(".mast");
    var mergedCase = bays[0].querySelector(".case");
    var destNow = new Map();
    root.classList.add("is-settling");
    if (opening) {
      var caseShots = [];
      var plateShots = [];
      var shelfCase, box, plateBox;
      for (i = 1; i < bays.length; i++) {
        shelfCase = bays[i].querySelector(".case");
        if (!shelfCase) continue;
        box = shelfCase.getBoundingClientRect();
        if (box.height > 1) caseShots.push({ el: shelfCase, rect: box });
      }
      for (i = 0; i < plates.length; i++) {
        plateBox = plates[i].getBoundingClientRect();
        if (plateBox.height > 1) plateShots.push({ el: plates[i], rect: plateBox });
        plates[i].setAttribute("aria-hidden", "true");
      }
      for (i = 0; i < cards.length; i++) {
        ensureHome(cards[i]);
        if (cards[i].parentNode !== shelfHost) shelfHost.appendChild(cards[i]);
        if (cards[i].classList.contains("is-lifted")) clearLift(cards[i]);
      }
      root.classList.add("is-merged");
      if (page && phoneMedia.matches) {
        if (mast) {
          pinFade(mast, mast.getBoundingClientRect(), 4);
          mast.setAttribute("aria-hidden", "true");
        }
        page.classList.add("is-finding");
      }
      var dest = mergedCase ? mergedCase.getBoundingClientRect() : null;
      for (i = 0; i < caseShots.length; i++) {
        if (phoneMedia.matches && !inView(caseShots[i].rect)) continue;
        pinTravel(
          caseShots[i].el,
          caseShots[i].rect,
          dest ? dampShift(dest.left - caseShots[i].rect.left) : 0,
          dest ? dampShift(dest.top - caseShots[i].rect.top) : 0
        );
      }
      for (i = 0; i < plateShots.length; i++) {
        if (phoneMedia.matches && !inView(plateShots[i].rect)) continue;
        pinTravel(
          plateShots[i].el,
          plateShots[i].rect,
          dest ? dampShift(dest.left - plateShots[i].rect.left) : 0,
          dest ? dampShift(dest.top - plateShots[i].rect.top) : 0
        );
      }
    } else {
      var origin = mergedCase ? mergedCase.getBoundingClientRect() : null;
      if (!foldTitle(input.value)) {
        for (i = 0; i < cards.length; i++) {
          if (!shown(cards[i])) showBook(cards[i]);
        }
      }
      for (i = 0; i < cards.length; i++) sendHome(cards[i]);
      root.classList.remove("is-merged");
      if (page) page.classList.remove("is-finding");
      if (mast) mast.removeAttribute("aria-hidden");
      for (i = 0; i < plates.length; i++) plates[i].removeAttribute("aria-hidden");
      shots.forEach(function (_, book) {
        if (shown(book)) destNow.set(book, book.getBoundingClientRect());
      });
      shiftCases(origin);
      if (mast && phoneMedia.matches) fadeChromeIn(mast);
    }
    syncBays(foldTitle(input.value));
    // A phone cannot ease hundreds of covers at once, so only the visible
    // books travel. Offscreen ones change shelves without their own animation.
    if (opening || phoneMedia.matches) glideBooks(shots, gen);
    else glideLoose(shots, gen, destNow);
  }

  function syncPhoneChrome() {
    var page = pageEl();
    if (!page || !root.classList.contains("is-merged")) return;
    var want = finder.classList.contains("is-open") && phoneMedia.matches;
    var has = page.classList.contains("is-finding");
    if (want === has) return;
    var shots = snapshotShown();
    clearBookMotion();
    releaseGlide();
    settleChrome();
    filterGen += 1;
    var mast = document.querySelector(".mast");
    if (want) {
      if (mast) {
        pinFade(mast, mast.getBoundingClientRect(), 4);
        mast.setAttribute("aria-hidden", "true");
      }
      page.classList.add("is-finding");
    } else {
      page.classList.remove("is-finding");
      if (mast) {
        mast.removeAttribute("aria-hidden");
        fadeChromeIn(mast);
      }
    }
    glideBooks(shots, filterGen);
  }

  function openField() {
    finder.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    playField(true);
    setSearchMode(true);
    if (typeof input.focus === "function") input.focus({ preventScroll: true });
  }

  function closeField() {
    if (document.activeElement === input) input.blur();
    finder.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    playField(false);
    setSearchMode(false);
  }

  toggle.addEventListener("click", function () {
    if (finder.classList.contains("is-open")) closeField();
    else openField();
  });

  if (phoneMedia.addEventListener) phoneMedia.addEventListener("change", syncPhoneChrome);
  else if (phoneMedia.addListener) phoneMedia.addListener(syncPhoneChrome);

  input.addEventListener("input", function () {
    applyFilter(input.value);
  });

  input.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (hooks.detailOpen && hooks.detailOpen()) return;
    event.stopPropagation();
    input.value = "";
    closeField();
    toggle.focus();
  });
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

  armFinder(root, cards, {
    dismissUnmatched: function (query) {
      if (open && query && !bookHit(open, query)) closeBook(true);
    },
    detailOpen: function () {
      return !!open;
    },
    closeDetail: function () {
      closeBook(true);
    }
  });
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
