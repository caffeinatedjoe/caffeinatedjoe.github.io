"use strict";

var SHEET_URL = "https://docs.google.com/spreadsheets/d/1hNxU4YCmZZ5uRfq8_eHUwLspzNWncJzmdclrzYAGlvM/pub?output=csv";
var COVER_CONCURRENCY = 2;
var COVER_GAP_MS = 160;

var SWATCHES = ["#2a2420", "#243028", "#2c2430", "#1e2a30", "#302418", "#242830", "#2a221c", "#1c2824"];

var coverCache = new Map();
var coverQueue = [];
var coverActive = 0;

function field(row, name) {
  if (!row || typeof row !== "object") return "";
  if (Object.prototype.hasOwnProperty.call(row, name) && row[name] != null) {
    return String(row[name]);
  }
  var wanted = name.toLowerCase();
  var keys = Object.keys(row);
  for (var i = 0; i < keys.length; i++) {
    if (keys[i].trim().toLowerCase() === wanted && row[keys[i]] != null) {
      return String(row[keys[i]]);
    }
  }
  return "";
}

function expandYear(year) {
  if (year >= 1900 && year <= 2100) return year;
  if (year >= 0 && year < 100) return year >= 70 ? 1900 + year : 2000 + year;
  return null;
}

function utcDay(year, month, day) {
  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  var time = Date.UTC(year, month - 1, day);
  var date = new Date(time);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }
  return time;
}

function parseReadDate(raw) {
  var value = String(raw || "").trim();
  var match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (match) return utcDay(expandYear(Number(match[3])), Number(match[1]), Number(match[2]));
  match = value.match(/^(\d{1,2})\/(\d{4})$/);
  if (match) return utcDay(expandYear(Number(match[2])), Number(match[1]), 1);
  match = value.match(/^(\d{4})$/);
  if (match) return utcDay(expandYear(Number(match[1])), 1, 1);
  return null;
}

function booksFromRows(rows) {
  var books = [];
  (rows || []).forEach(function (row, index) {
    var title = field(row, "title").trim();
    if (!title) return;
    books.push({
      title: title,
      author: field(row, "author").trim(),
      readAt: parseReadDate(field(row, "date read")),
      order: index
    });
  });
  return orderNewestFirst(books);
}

function orderNewestFirst(books) {
  var anchor = null;
  var leading = [];
  books.forEach(function (book) {
    if (book.readAt != null) {
      if (leading.length) {
        leading.forEach(function (item, index) {
          item.sortAt = book.readAt + (leading.length - index);
        });
        leading = [];
      }
      book.sortAt = book.readAt;
      anchor = book.readAt;
    } else if (anchor == null) {
      leading.push(book);
    } else {
      anchor -= 1;
      book.sortAt = anchor;
    }
  });
  if (leading.length) {
    leading.forEach(function (item, index) {
      item.sortAt = leading.length - index;
    });
  }
  return books.slice().sort(function (a, b) {
    return b.sortAt - a.sortAt || a.order - b.order;
  });
}

function swatchFor(title) {
  var hash = 0;
  for (var i = 0; i < title.length; i++) hash = (hash + title.charCodeAt(i) * (i + 1)) % SWATCHES.length;
  return SWATCHES[hash];
}

function monogram(title) {
  var match = title.match(/[A-Za-z0-9]/);
  return match ? match[0].toUpperCase() : "·";
}

function normalizeAuthor(author) {
  var trimmed = author.trim().replace(/\s+/g, " ");
  var inverted = trimmed.match(/^([A-Za-z][A-Za-z.'’-]*),\s*([A-Za-z].+)$/);
  if (!inverted) return trimmed;
  return (inverted[2].trim() + " " + inverted[1].trim()).trim();
}

function cacheKey(title, author) {
  return title.trim().toLowerCase() + "|" + author.trim().toLowerCase();
}

function fetchWithTimeout(url, ms) {
  var controller = new AbortController();
  var timer = setTimeout(function () {
    controller.abort();
  }, ms);
  return fetch(url, { signal: controller.signal }).finally(function () {
    clearTimeout(timer);
  });
}

function searchCoverId(title, author) {
  var url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("title", title);
  if (author) url.searchParams.set("author", author);
  url.searchParams.set("limit", "1");
  url.searchParams.set("fields", "cover_i");
  return fetchWithTimeout(url.href, 8000).then(function (response) {
    if (!response.ok) return null;
    return response.json();
  }).then(function (payload) {
    var coverId = payload && payload.docs && payload.docs[0] && payload.docs[0].cover_i;
    if (typeof coverId !== "number" || coverId <= 0) return null;
    return coverId;
  }).catch(function () {
    return null;
  });
}

function lookupCover(title, author) {
  var authorName = normalizeAuthor(author);
  var attempts = [{ title: title, author: authorName }];
  var shortTitle = title.split(":")[0].trim();
  if (shortTitle && shortTitle.length >= 2 && shortTitle !== title) {
    attempts.push({ title: shortTitle, author: authorName });
  }
  var chain = Promise.resolve(null);
  attempts.forEach(function (attempt) {
    chain = chain.then(function (found) {
      if (found) return found;
      return searchCoverId(attempt.title, attempt.author);
    });
  });
  return chain.then(function (coverId) {
    return coverId ? "https://covers.openlibrary.org/b/id/" + coverId : null;
  });
}

function drainCoverQueue() {
  while (coverActive < COVER_CONCURRENCY && coverQueue.length) {
    var job = coverQueue.shift();
    coverActive += 1;
    lookupCover(job.title, job.author).then(job.resolve, function () {
      job.resolve(null);
    }).finally(function () {
      coverActive -= 1;
      setTimeout(drainCoverQueue, COVER_GAP_MS);
    });
  }
}

function coverFor(title, author) {
  var key = cacheKey(title, author);
  if (coverCache.has(key)) return coverCache.get(key);
  var pending = new Promise(function (resolve) {
    coverQueue.push({ title: title, author: author, resolve: resolve });
    drainCoverQueue();
  });
  coverCache.set(key, pending);
  return pending;
}

function mountCover(frame, baseUrl) {
  var image = document.createElement("img");
  image.className = "cover";
  image.alt = "";
  image.loading = "lazy";
  image.decoding = "async";
  image.sizes = "(max-width: 560px) 46vw, (max-width: 900px) 30vw, 220px";

  function reveal() {
    if (!image.complete) return;
    if (image.naturalWidth < 20 || image.naturalHeight < 20) {
      image.remove();
      return;
    }
    frame.classList.add("has-cover");
  }

  image.addEventListener("load", reveal);
  image.addEventListener("error", function () {
    image.remove();
  });
  image.srcset = baseUrl + "-M.jpg 180w, " + baseUrl + "-L.jpg 500w";
  image.src = baseUrl + "-M.jpg";
  frame.insertBefore(image, frame.firstChild);
  reveal();
}

function buildCard(book) {
  var card = document.createElement("article");
  card.className = "card";
  card.dataset.title = book.title;
  card.dataset.author = book.author;

  var frame = document.createElement("div");
  frame.className = "cover-frame";
  frame.style.setProperty("--swatch", swatchFor(book.title));

  var placeholder = document.createElement("div");
  placeholder.className = "placeholder";
  placeholder.setAttribute("aria-hidden", "true");
  var letter = document.createElement("span");
  letter.textContent = monogram(book.title);
  placeholder.appendChild(letter);
  frame.appendChild(placeholder);

  var meta = document.createElement("div");
  meta.className = "meta";
  var title = document.createElement("h2");
  title.className = "title";
  title.textContent = book.title;
  var author = document.createElement("p");
  author.className = "author";
  author.textContent = book.author;
  meta.appendChild(title);
  meta.appendChild(author);

  card.appendChild(frame);
  card.appendChild(meta);
  return card;
}

function renderBooks(grid, books) {
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      var card = entry.target;
      var frame = card.querySelector(".cover-frame");
      coverFor(card.dataset.title || "", card.dataset.author || "").then(function (baseUrl) {
        if (!baseUrl || !frame.isConnected) return;
        mountCover(frame, baseUrl);
      });
    });
  }, { rootMargin: "500px 0px", threshold: 0.01 });

  var fragment = document.createDocumentFragment();
  books.forEach(function (book) {
    fragment.appendChild(buildCard(book));
  });
  grid.appendChild(fragment);
  grid.querySelectorAll(".card").forEach(function (card) {
    observer.observe(card);
  });
}

function boot() {
  var status = document.getElementById("status");
  var grid = document.getElementById("grid");
  if (!status || !grid) return;

  if (typeof Papa === "undefined") {
    status.textContent = "The list couldn’t be loaded.";
    return;
  }

  status.textContent = "Loading…";
  Papa.parse(SHEET_URL, {
    download: true,
    header: true,
    skipEmptyLines: "greedy",
    complete: function (results) {
      var books = booksFromRows(results && results.data);
      if (!books.length) {
        status.textContent = "Nothing on the list yet.";
        return;
      }
      status.hidden = true;
      grid.hidden = false;
      renderBooks(grid, books);
    },
    error: function () {
      status.textContent = "The list couldn’t be loaded.";
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

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    parseReadDate: parseReadDate,
    booksFromRows: booksFromRows,
    normalizeAuthor: normalizeAuthor
  };
}
