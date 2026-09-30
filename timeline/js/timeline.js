const MAX_ZOOM = 36;
const ZOOM_BREAKS = [
  { rank: 4, min: 8 },
  { rank: 3, min: 3.4 },
  { rank: 2, min: 2 },
  { rank: 1, min: 0 },
];

const BASIS_LABEL = {
  "traditional-chronology": "Traditional date",
  approximate: "Date uncertain",
  "chronology-alignment": "Placed after the Flood",
};

const CATEGORY_LABEL = {
  scripture: "Scripture",
  historical: "Historical",
  interpretation: "Interpretation",
};

const KIND_LABEL = {
  person: "Person",
  event: "Event",
  civilization: "Civilization",
  period: "Period",
  culture: "Culture",
};

const TOPIC_LABELS = {
  creation: "Creation",
  fall: "The Fall",
  flood: "The Flood",
  babel: "Babel",
  patriarchs: "Patriarchs",
  mesopotamia: "Mesopotamia",
  egypt: "Egypt",
  joseph: "Joseph",
  moses: "Moses",
  exodus: "Exodus",
  israel: "Israel",
  david: "David and the kings",
  jesus: "Jesus",
  church: "The church",
  greece: "Greece",
  rome: "Rome",
  myths: "Myths",
  "middle-ages": "Middle Ages",
  reformation: "Reformation",
  exploration: "Exploration",
  america: "American history",
  slavery: "Slavery and freedom",
  industry: "Industry",
  modern: "Modern world",
  bible: "The Bible",
};

const LEVEL_LABEL = {
  "read-aloud": "Read-aloud",
  "early-reader": "Early reader",
  independent: "Independent",
  advanced: "Advanced",
};

const WASH = [
  "rgba(232, 196, 122, 0.18)",
  "rgba(126, 184, 176, 0.16)",
  "rgba(232, 196, 122, 0.12)",
  "rgba(176, 154, 214, 0.12)",
  "rgba(126, 184, 176, 0.14)",
  "rgba(232, 168, 122, 0.13)",
  "rgba(232, 196, 122, 0.14)",
  "rgba(120, 156, 196, 0.13)",
  "rgba(214, 164, 120, 0.14)",
];

const state = {
  camera: { t: 0.5, zoom: 1 },
  anim: 0,
  selectedId: null,
  panelMode: "event",
  parentOn: false,
  filters: { age: "", level: "", type: "", era: "", topic: "" },
  suppressClick: false,
};

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const measure = document.createElement("canvas").getContext("2d");
measure.font = "800 12.5px Nunito, sans-serif";

const viewport = document.getElementById("viewport");
const world = document.getElementById("world");
const tooltip = document.getElementById("tooltip");
const panel = document.getElementById("panel");
const live = document.getElementById("live");
const loading = document.getElementById("loading");
const eraBar = document.getElementById("era-bar");
const scaleNote = document.getElementById("scale-note");
const minimap = document.getElementById("minimap");
const minimapTrack = document.getElementById("minimap-track");
const minimapWindow = document.getElementById("minimap-window");
const banner = document.getElementById("banner");

let chapters = [];
let eras = [];
let events = [];
let books = [];
let eventsById = new Map();
let pins = new Map();
let spanEls = new Map();
let chapterEls = [];
let axisEl;
let tickLayer;

function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "text") node.textContent = value;
    else node.setAttribute(key, String(value));
  }
  for (const child of children) node.append(child);
  return node;
}

function formatYear(year) {
  const n = Math.abs(Math.round(year));
  if (year < 0) return `${n} BC`;
  if (year > 0) return `AD ${n}`;
  return "1 BC / AD 1";
}

function formatWhen(event) {
  if (event.yearLabel) return event.yearLabel;
  if (event.eraOnly) return "Books for this period";
  if (event.category === "scripture") return "No calendar year in the Bible";
  return "No calendar year assigned";
}

function indexChapters(list) {
  const total = list.reduce((sum, chapter) => sum + chapter.weight, 0);
  let cursor = 0;
  return list.map((chapter) => {
    const width = chapter.weight / total;
    const next = { ...chapter, t0: cursor, t1: cursor + width };
    cursor += width;
    return next;
  });
}

function yearToT(year) {
  if (year <= chapters[0].startYear) return 0;
  const last = chapters[chapters.length - 1];
  if (year >= last.endYear) return 1;
  for (const chapter of chapters) {
    if (year <= chapter.endYear) {
      const span = chapter.endYear - chapter.startYear;
      const u = span === 0 ? 0 : (year - chapter.startYear) / span;
      return chapter.t0 + Math.min(1, Math.max(0, u)) * (chapter.t1 - chapter.t0);
    }
  }
  return 1;
}

function tToYear(t) {
  if (t <= 0) return chapters[0].startYear;
  const last = chapters[chapters.length - 1];
  if (t >= 1) return last.endYear;
  for (const chapter of chapters) {
    if (t <= chapter.t1) {
      const u = (t - chapter.t0) / (chapter.t1 - chapter.t0 || 1);
      return chapter.startYear + u * (chapter.endYear - chapter.startYear);
    }
  }
  return last.endYear;
}

function eventSpan(event) {
  return [event.startYear, event.endYear ?? event.startYear];
}

let positionOf = new Map();

function indexPositions() {
  positionOf = new Map();
  for (const chapter of chapters) {
    const mates = events
      .filter((event) => event.era === chapter.id)
      .sort((a, b) => a.sortKey - b.sortKey || a.title.localeCompare(b.title));
    const count = mates.length;
    mates.forEach((event, index) => {
      const pad = 0.14;
      const u = count <= 1 ? 0.5 : pad + ((1 - 2 * pad) * index) / (count - 1);
      positionOf.set(event.id, chapter.t0 + u * (chapter.t1 - chapter.t0));
    });
  }
}

function eventT(event) {
  return positionOf.get(event.id) ?? 0.5;
}

function fitChapter(id) {
  const chapter = chapters.find((item) => item.id === id);
  if (!chapter) return;
  const span = Math.max(0.045, (chapter.t1 - chapter.t0) * 1.12);
  animateTo({ t: (chapter.t0 + chapter.t1) / 2, zoom: Math.min(MAX_ZOOM, 1 / span) });
}

function isRibbon(event) {
  return (
    event.endYear != null &&
    event.endYear !== event.startYear &&
    (event.kind === "civilization" || event.kind === "period" || event.kind === "culture")
  );
}

function dotYear(event) {
  if (isRibbon(event)) return null;
  if (event.endYear != null && event.endYear !== event.startYear) {
    return (event.startYear + event.endYear) / 2;
  }
  return event.startYear;
}

function visibleRank(zoom) {
  for (const step of ZOOM_BREAKS) {
    if (zoom >= step.min) return step.rank;
  }
  return 1;
}

function labelFor(event) {
  return event.shortTitle || event.title;
}

function labelWidth(text) {
  return Math.ceil(measure.measureText(text).width) + 18;
}

function filtersActive() {
  if (!state.parentOn) return false;
  return Object.values(state.filters).some((value) => value !== "" && value != null);
}

function bookMatches(book) {
  const filters = state.filters;
  if (!state.parentOn) return true;
  if (filters.age !== "") {
    const age = Number(filters.age);
    if (!Number.isFinite(age) || age < book.ageMin || age > book.ageMax) return false;
  }
  if (filters.level && !book.levels.includes(filters.level)) return false;
  if (filters.type && book.type !== filters.type) return false;
  if (filters.topic && !book.topics.includes(filters.topic)) return false;
  if (filters.era) {
    const hit = book.era === filters.era || book.eventIds.some((id) => eventsById.get(id)?.era === filters.era);
    if (!hit) return false;
  }
  return true;
}

function booksFor(eventId) {
  return books
    .filter((book) => book.eventIds.includes(eventId) && bookMatches(book))
    .sort(compareBooks);
}

function compareBooks(a, b) {
  if (a.type !== b.type) return a.type === "nonfiction" ? -1 : 1;
  return a.ageMin - b.ageMin || a.title.localeCompare(b.title);
}

function readingPath() {
  const groups = new Map();
  for (const book of books) {
    if (!bookMatches(book)) continue;
    const id = book.primaryEventId || `era:${book.era || "other"}`;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(book);
  }
  return [...groups.entries()]
    .map(([id, list]) => {
      const event = eventsById.get(id);
      if (event) return { event, books: list.sort(compareBooks), sortKey: event.sortKey ?? 0 };
      const era = eras.find((item) => id === `era:${item.id}`);
      return {
        event: {
          id: era?.id || id,
          title: era?.title || "More books",
          category: "historical",
          eraOnly: true,
          sortKey: (era?.sortKey || 99) * 1000,
        },
        books: list.sort(compareBooks),
        sortKey: (era?.sortKey || 99) * 1000,
      };
    })
    .filter((group) => group.event)
    .sort((a, b) => a.sortKey - b.sortKey || a.event.title.localeCompare(b.event.title));
}

function matchingEvent(event) {
  return books.some((book) => book.eventIds.includes(event.id) && bookMatches(book));
}

function metrics() {
  const width = viewport.clientWidth || 1;
  const height = viewport.clientHeight || 1;
  const worldWidth = width * state.camera.zoom;
  const origin = state.camera.t * worldWidth - width / 2;
  return { width, height, worldWidth, origin };
}

function clampCamera() {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, state.camera.zoom));
  state.camera.zoom = zoom;
  const half = 0.5 / zoom;
  if (zoom <= 1) {
    state.camera.t = 0.5;
    return;
  }
  state.camera.t = Math.min(1 - half, Math.max(half, state.camera.t));
}

function tAtClient(clientX) {
  const rect = viewport.getBoundingClientRect();
  const localX = clientX - rect.left;
  const { worldWidth, origin } = metrics();
  return (origin + localX) / worldWidth;
}

function setZoomKeepingT(tAnchor, clientX, nextZoom) {
  const rect = viewport.getBoundingClientRect();
  const localX = clientX - rect.left;
  state.camera.zoom = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
  const worldWidth = rect.width * state.camera.zoom;
  state.camera.t = tAnchor + (rect.width / 2 - localX) / worldWidth;
  clampCamera();
  render();
}

function zoomBy(factor, clientX) {
  const rect = viewport.getBoundingClientRect();
  const x = clientX ?? rect.left + rect.width / 2;
  setZoomKeepingT(tAtClient(x), x, state.camera.zoom * factor);
}

function cancelAnim() {
  if (state.anim) cancelAnimationFrame(state.anim);
  state.anim = 0;
}

function animateTo(target) {
  cancelAnim();
  const from = { ...state.camera };
  if (reduceMotion) {
    state.camera.t = target.t;
    state.camera.zoom = target.zoom;
    clampCamera();
    render();
    return;
  }
  const start = performance.now();
  const duration = 480;
  const step = (now) => {
    const u = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - u) ** 3;
    state.camera.t = from.t + (target.t - from.t) * eased;
    state.camera.zoom = from.zoom + (target.zoom - from.zoom) * eased;
    clampCamera();
    render();
    if (u < 1) state.anim = requestAnimationFrame(step);
    else state.anim = 0;
  };
  state.anim = requestAnimationFrame(step);
}

function fitYears(startYear, endYear) {
  let t0 = yearToT(Math.min(startYear, endYear));
  let t1 = yearToT(Math.max(startYear, endYear));
  const pad = Math.max(0.008, (t1 - t0) * 0.1);
  t0 = Math.max(0, t0 - pad);
  t1 = Math.min(1, t1 + pad);
  const span = Math.max(0.02, t1 - t0);
  animateTo({ t: (t0 + t1) / 2, zoom: Math.min(MAX_ZOOM, 1 / span) });
}

function focusEvent(id, openPanel) {
  const event = eventsById.get(id);
  if (!event) return;
  const rankZoom = event.importance <= 1 ? 1 : event.importance === 2 ? 2.2 : event.importance === 3 ? 3.6 : 8.2;
  const zoom = Math.max(state.camera.zoom, rankZoom);
  animateTo({ t: eventT(event), zoom });
  if (openPanel) openEvent(id);
}

function niceStep(rough) {
  const steps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000];
  return steps.find((step) => step >= rough) || 1000;
}

function buildStatic() {
  world.replaceChildren();
  chapterEls = chapters.map((chapter, index) => {
    const node = el("div", { class: "chapter" });
    node.style.background = WASH[index % WASH.length];
    const label = el("div", { class: "chapter-label", text: chapter.title });
    node.append(label);
    world.append(node);
    return { chapter, node, label };
  });
  axisEl = el("div", { class: "axis" });
  tickLayer = el("div", { class: "ticks" });
  world.append(axisEl, tickLayer);

  for (const event of events) {
    if (isRibbon(event)) {
      const button = el("button", {
        type: "button",
        class: `span ${event.category}${event.dateBasis === "chronology-alignment" ? " alignment" : ""}`,
        "data-id": event.id,
      });
      button.append(el("span", { text: labelFor(event) }));
      button.addEventListener("click", () => {
        if (state.suppressClick) return;
        openEvent(event.id);
      });
      world.append(button);
      spanEls.set(event.id, button);
    } else {
      const up = event.category === "scripture";
      const pin = el("div", {
        class: `pin ${event.category} ${up ? "up" : "down"}${event.alsoHistorical ? " also-historical" : ""}${event.alsoInScripture ? " also-scripture" : ""}`,
        "data-id": event.id,
      });
      const button = el("button", { type: "button", class: "marker" });
      button.append(el("span", { class: "marker-dot" }), el("span", { class: "marker-label", text: labelFor(event) }));
      button.addEventListener("click", () => {
        if (state.suppressClick) return;
        openEvent(event.id);
      });
      button.addEventListener("focus", () => ensureVisible(event));
      pin.append(button);
      world.append(pin);
      pins.set(event.id, { pin, button, event });
    }
  }
}

function ensureVisible(event) {
  const t = eventT(event);
  const half = 0.5 / state.camera.zoom;
  if (t < state.camera.t - half + 0.02 || t > state.camera.t + half - 0.02) {
    state.camera.t = t;
    clampCamera();
    render();
  }
}

function syncChrome() {
  const stage = document.querySelector(".stage");
  if (!stage) return;
  document.documentElement.style.setProperty("--chrome-top", `${stage.offsetTop}px`);
}

function render() {
  syncChrome();
  const m = metrics();
  const rank = visibleRank(state.camera.zoom);
  world.style.width = `${m.worldWidth}px`;
  world.style.transform = `translate3d(${-m.origin}px, 0, 0)`;

  const ribbonTop = 28;
  const ribbonH = 22;
  const ribbonGap = 6;
  const visibleRibbons = events.filter((event) => isRibbon(event) && event.importance <= rank);
  visibleRibbons.sort((a, b) => a.importance - b.importance || a.sortKey - b.sortKey);
  const rowEnds = [];
  const maxRows = m.height < 520 ? 2 : m.height < 700 ? 3 : 4;
  for (const event of visibleRibbons) {
    let row = rowEnds.findIndex((end) => event.startYear >= end - 0.01);
    if (row === -1) {
      if (rowEnds.length >= maxRows) {
        event._row = -1;
        continue;
      }
      row = rowEnds.length;
    }
    rowEnds[row] = event.endYear;
    event._row = row;
  }
  const ribbonBottom = ribbonTop + Math.max(1, rowEnds.length) * (ribbonH + ribbonGap);
  const axisY = Math.max(ribbonBottom + 54, Math.min(m.height * 0.58, m.height - 92));
  axisEl.style.top = `${axisY}px`;
  axisEl.style.width = `${m.worldWidth}px`;

  for (const { chapter, node, label } of chapterEls) {
    const left = chapter.t0 * m.worldWidth;
    const width = (chapter.t1 - chapter.t0) * m.worldWidth;
    node.style.left = `${left}px`;
    node.style.width = `${width}px`;
    label.hidden = width < 72;
    const sticky = Math.max(8, m.origin - left + 8);
    label.style.left = `${Math.min(sticky, Math.max(8, width - 120))}px`;
  }

  for (const event of events) {
    if (!isRibbon(event)) continue;
    const button = spanEls.get(event.id);
    const show = event.importance <= rank && event._row >= 0;
    button.hidden = !show;
    if (!show) continue;
    const x0 = yearToT(event.startYear) * m.worldWidth;
    const x1 = yearToT(event.endYear) * m.worldWidth;
    button.style.left = `${x0}px`;
    button.style.width = `${Math.max(8, x1 - x0)}px`;
    button.style.top = `${ribbonTop + event._row * (ribbonH + ribbonGap)}px`;
    button.setAttribute("aria-label", ariaLabel(event));
    const text = button.querySelector("span");
    text.hidden = x1 - x0 < 56;
  }

  const dots = events
    .filter((event) => !isRibbon(event) && event.importance <= rank)
    .map((event) => {
      const x = eventT(event) * m.worldWidth;
      const up = event.category === "scripture";
      return { event, x, up, width: labelWidth(labelFor(event)) };
    });

  placeLanes(dots.filter((dot) => dot.up), "up", axisY, ribbonBottom + 8, m.height);
  placeLanes(dots.filter((dot) => !dot.up), "down", axisY, ribbonBottom + 8, m.height);

  const shown = new Set(dots.map((dot) => dot.event.id));
  const filtering = filtersActive();
  for (const [id, { pin, button, event }] of pins) {
    const dot = dots.find((item) => item.event.id === id);
    const show = shown.has(id);
    pin.hidden = !show;
    button.tabIndex = show ? 0 : -1;
    if (!show) continue;
    pin.style.left = `${dot.x}px`;
    pin.style.top = `${dot.y}px`;
    const stem = Math.max(0, Math.abs(dot.y - axisY) - 8);
    pin.style.setProperty("--stem", `${stem}px`);
    pin.classList.toggle("no-label", !dot.showLabel);
    pin.classList.toggle("is-selected", state.selectedId === id);
    pin.classList.toggle("is-dim", filtering && !matchingEvent(event));
    pin.classList.toggle("has-book", filtering && matchingEvent(event));
    button.setAttribute("aria-label", ariaLabel(event));
  }

  renderTicks(m, axisY);
  renderMinimap();
  renderScale(m);
  highlightEra();
}

function placeLanes(items, direction, axisY, ribbonBottom, height) {
  items.sort((a, b) => a.event.importance - b.event.importance || a.x - b.x);
  const lanes = [];
  const pitch = height < 520 ? 30 : 34;
  for (const item of items) {
    const half = item.width / 2;
    const left = item.x - half;
    let lane = 0;
    while (lane < lanes.length && left < lanes[lane] + 6) lane += 1;
    const y = direction === "up" ? axisY - 18 - lane * pitch : axisY + 18 + lane * pitch;
    const fits = direction === "up" ? y > ribbonBottom : y < height - 18;
    if (!fits) {
      item.y = direction === "up" ? axisY - 16 : axisY + 16;
      item.showLabel = false;
      continue;
    }
    item.y = y;
    item.showLabel = true;
    lanes[lane] = item.x + half;
  }
}

function renderTicks() {
  tickLayer.replaceChildren();
}

function renderMinimap() {
  const half = 0.5 / state.camera.zoom;
  const left = (state.camera.t - half) * 100;
  const width = (1 / state.camera.zoom) * 100;
  minimapWindow.style.left = `${left}%`;
  minimapWindow.style.width = `${width}%`;
}

function renderScale() {
  scaleNote.textContent = "Markers follow the story, not a made-up year for Scripture. A historical date appears only when a source gives one. Zoom in to see more.";
}

function highlightEra() {
  const current = (chapters.find((chapter) => state.camera.t >= chapter.t0 && state.camera.t < chapter.t1) || chapters[chapters.length - 1])?.id;
  for (const button of eraBar.querySelectorAll(".era-chip")) {
    if (button.dataset.era === current) button.setAttribute("aria-current", "true");
    else button.removeAttribute("aria-current");
  }
}

function ariaLabel(event) {
  const parts = [event.title, CATEGORY_LABEL[event.category] || event.category];
  if (event.alsoHistorical) parts.push("also historical");
  if (event.alsoInScripture) parts.push("also in Scripture");
  parts.push(formatWhen(event));
  return parts.join(", ");
}

function badge(category) {
  return el("span", { class: `badge ${category}`, text: CATEGORY_LABEL[category] || category });
}

function openEvent(id) {
  state.selectedId = id;
  state.panelMode = "event";
  const event = eventsById.get(id);
  if (!event) return;
  history.replaceState(null, "", `#${encodeURIComponent(id)}`);
  renderPanel();
  panel.hidden = false;
  live.textContent = `${event.title}. ${CATEGORY_LABEL[event.category]}. Details opened.`;
  panel.querySelector(".icon-button")?.focus();
  render();
}

function openPath() {
  state.panelMode = "path";
  state.selectedId = null;
  renderPath();
  panel.hidden = false;
  live.textContent = "Reading path opened.";
  panel.querySelector(".icon-button")?.focus();
  render();
}

function closePanel() {
  panel.hidden = true;
  state.selectedId = null;
  render();
  viewport.focus();
}

function renderPanel() {
  const event = eventsById.get(state.selectedId);
  if (!event) return;
  panel.replaceChildren();
  const head = el("div", { class: "panel-head" });
  const titles = el("div");
  titles.append(
    el("p", { class: "kicker", text: KIND_LABEL[event.kind] || "Marker" }),
    el("h2", { id: "panel-title", text: event.title }),
  );
  head.append(titles, closeButton());
  const body = el("div", { class: "panel-body" });
  const badges = el("div", { class: "badges" });
  badges.append(badge(event.category));
  if (event.alsoHistorical && event.category !== "historical") badges.append(badge("historical"));
  if (event.alsoInScripture && event.category !== "scripture") badges.append(badge("scripture"));
  if (BASIS_LABEL[event.dateBasis]) {
    badges.append(el("span", { class: "badge basis", text: BASIS_LABEL[event.dateBasis] }));
  }
  body.append(badges, el("p", { class: "when", text: formatWhen(event) }));
  body.append(el("p", { class: "lead", text: leadFor(event) }));
  if (event.yearNote) body.append(el("p", { class: "year-note", text: event.yearNote }));
  if (event.kidNote) body.append(el("p", { class: "note", text: event.kidNote }));
  if (event.textbookNote) body.append(el("div", { class: "callout", text: event.textbookNote }));
  if (event.scripture?.length) {
    body.append(el("p", { class: "section-label", text: event.category === "scripture" ? "In the Bible" : "Read alongside" }));
    const refs = el("div", { class: "refs" });
    for (const ref of event.scripture) refs.append(el("span", { class: "ref", text: ref }));
    body.append(refs);
  }
  for (const paragraph of event.context || []) body.append(el("p", { class: "context", text: paragraph }));
  if (event.relatedIds?.length) {
    body.append(el("p", { class: "section-label", text: "Keep exploring" }));
    const row = el("div", { class: "related" });
    for (const relatedId of event.relatedIds) {
      const related = eventsById.get(relatedId);
      if (!related) continue;
      const button = el("button", { type: "button", text: related.shortTitle || related.title });
      button.addEventListener("click", () => focusEvent(relatedId, true));
      row.append(button);
    }
    body.append(row);
  }
  const list = booksFor(event.id);
  body.append(el("p", {
    class: "section-label",
    text: state.parentOn && filtersActive() ? "Books matching the parent filters" : "Books to go further",
  }));
  if (!list.length) {
    body.append(el("p", {
      text: filtersActive()
        ? "None of the books for this marker match the parent filters."
        : "No books in this library yet. New titles can be added in the data files.",
    }));
  } else {
    for (const book of list) body.append(bookCard(book));
  }
  panel.append(head, body);
}

function leadFor(event) {
  if (event.category === "scripture" && event.alsoHistorical) {
    return "The Bible describes this, and historical records do too.";
  }
  if (event.category === "historical" && event.alsoInScripture) {
    return "Historical records tell this, and the Bible tells it too.";
  }
  if (event.category === "scripture") return "The Bible describes this.";
  if (event.category === "historical") return "This comes from historical records.";
  if (event.category === "interpretation") return "This is an interpretation, not a settled fact.";
  return "This mark is the present day on the map.";
}

function bookCard(book) {
  const card = el("article", { class: "book" });
  const badges = el("div", { class: "badges" });
  badges.append(el("span", {
    class: `badge ${book.type === "fiction" ? "fiction" : "nonfiction"}`,
    text: book.type === "fiction" ? "Fiction" : "Nonfiction",
  }));
  badges.append(el("span", { class: "badge basis", text: `Ages ${book.ageMin}\u2013${book.ageMax}` }));
  for (const level of book.levels) {
    badges.append(el("span", { class: "badge basis", text: LEVEL_LABEL[level] || level }));
  }
  card.append(
    badges,
    el("h3", { text: book.title }),
    el("p", { class: "by", text: book.author }),
    el("p", { text: book.blurb }),
  );
  if (book.parentNote) card.append(el("p", { class: "note", text: `Note: ${book.parentNote}` }));
  return card;
}

function renderPath() {
  const groups = readingPath();
  panel.replaceChildren();
  const head = el("div", { class: "panel-head" });
  const titles = el("div");
  titles.append(
    el("p", { class: "kicker", text: "Parent tools" }),
    el("h2", { id: "panel-title", text: "Reading path" }),
  );
  head.append(titles, closeButton());
  const body = el("div", { class: "panel-body" });
  const count = groups.reduce((sum, group) => sum + group.books.length, 0);
  body.append(el("p", {
    text: count
      ? `${count} ${count === 1 ? "book" : "books"} in timeline order. This is a path through the filters, not every book in the library.`
      : "No books match these filters. Try a wider age, or clear the topic.",
  }));
  if (count) {
    const copy = el("button", { type: "button", class: "path-button", text: "Copy list" });
    copy.addEventListener("click", () => copyPath(groups, copy));
    body.append(copy);
  }
  for (const group of groups) {
    const section = el("section", { class: "path-group" });
    const jump = el("button", { type: "button", class: "text-button", text: "Show on timeline" });
    jump.addEventListener("click", () => {
      if (group.event.eraOnly) fitChapter(group.event.id);
      else focusEvent(group.event.id, true);
    });
    section.append(
      el("h3", { text: group.event.title }),
      el("p", { class: "by", text: `${formatWhen(group.event)} · ${CATEGORY_LABEL[group.event.category]}` }),
      jump,
    );
    for (const book of group.books) section.append(bookCard(book));
    body.append(section);
  }
  panel.append(head, body);
}

function closeButton() {
  const button = el("button", { type: "button", class: "icon-button", "aria-label": "Close panel", text: "×" });
  button.addEventListener("click", closePanel);
  return button;
}

async function copyPath(groups, button) {
  const text = groups
    .map((group) => {
      const lines = [`${group.event.title} (${formatWhen(group.event)})`];
      for (const book of group.books) lines.push(`- ${book.title} — ${book.author}`);
      return lines.join("\n");
    })
    .join("\n\n");
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
  } catch {
    button.textContent = "Copy failed";
  }
  setTimeout(() => {
    button.textContent = "Copy list";
  }, 1600);
}

function updatePathCount() {
  const button = document.getElementById("path-button");
  const count = state.parentOn ? readingPath().reduce((sum, group) => sum + group.books.length, 0) : books.length;
  button.textContent = state.parentOn ? `Reading path (${count})` : "Reading path";
}

function setupEras() {
  eraBar.replaceChildren(
    ...eras.map((era) => {
      const button = el("button", { type: "button", class: "era-chip", text: era.title });
      button.dataset.era = era.id;
      button.title = era.blurb || era.title;
      button.addEventListener("click", () => fitChapter(era.id));
      return button;
    }),
  );
  const eraSelect = document.getElementById("filter-era");
  for (const era of eras) eraSelect.append(el("option", { value: era.id, text: era.title }));
  const topics = [...new Set(books.flatMap((book) => book.topics))].sort((a, b) => {
    return (TOPIC_LABELS[a] || a).localeCompare(TOPIC_LABELS[b] || b);
  });
  const topicSelect = document.getElementById("filter-topic");
  for (const topic of topics) {
    topicSelect.append(el("option", { value: topic, text: TOPIC_LABELS[topic] || topic }));
  }
}

function setupParent() {
  const toggle = document.getElementById("parent-toggle");
  const bar = document.getElementById("parent-bar");
  toggle.addEventListener("click", () => {
    state.parentOn = !state.parentOn;
    toggle.setAttribute("aria-pressed", String(state.parentOn));
    bar.hidden = !state.parentOn;
    syncChrome();
    updatePathCount();
    if (state.panelMode === "path" && !panel.hidden) renderPath();
    if (state.panelMode === "event" && state.selectedId && !panel.hidden) renderPanel();
    render();
  });
  const bind = (id, key, eventName) => {
    document.getElementById(id).addEventListener(eventName, (event) => {
      state.filters[key] = event.target.value;
      updatePathCount();
      if (!panel.hidden && state.panelMode === "path") renderPath();
      if (!panel.hidden && state.panelMode === "event") renderPanel();
      render();
    });
  };
  bind("filter-age", "age", "input");
  bind("filter-level", "level", "change");
  bind("filter-type", "type", "change");
  bind("filter-era", "era", "change");
  bind("filter-topic", "topic", "change");
  document.getElementById("clear-filters").addEventListener("click", () => {
    state.filters = { age: "", level: "", type: "", era: "", topic: "" };
    for (const id of ["filter-age", "filter-level", "filter-type", "filter-era", "filter-topic"]) {
      document.getElementById(id).value = "";
    }
    updatePathCount();
    if (!panel.hidden && state.panelMode === "path") renderPath();
    if (!panel.hidden && state.panelMode === "event") renderPanel();
    render();
  });
  document.getElementById("path-button").addEventListener("click", openPath);
}

function setupSearch() {
  const input = document.getElementById("search");
  const list = document.getElementById("search-results");
  let active = -1;
  const close = () => {
    list.hidden = true;
    list.replaceChildren();
    active = -1;
  };
  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    if (query.length < 2) {
      close();
      return;
    }
    const hits = events
      .filter((event) => haystack(event).includes(query))
      .slice(0, 8);
    list.replaceChildren(
      ...hits.map((event, index) => {
        const item = el("li");
        const button = el("button", { type: "button", role: "option" });
        button.append(el("span", { text: event.title }), el("small", { text: `${CATEGORY_LABEL[event.category]} · ${formatWhen(event)}` }));
        button.addEventListener("click", () => {
          input.value = event.title;
          close();
          focusEvent(event.id, true);
        });
        item.append(button);
        if (index === active) button.setAttribute("aria-selected", "true");
        return item;
      }),
    );
    if (!hits.length) {
      list.append(el("li", { text: "No matches" }));
    }
    list.hidden = false;
    active = -1;
  });
  input.addEventListener("keydown", (event) => {
    const options = [...list.querySelectorAll("button")];
    if (event.key === "Escape") {
      close();
      return;
    }
    if (!options.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      active = event.key === "ArrowDown" ? Math.min(options.length - 1, active + 1) : Math.max(0, active - 1);
      options.forEach((option, index) => option.setAttribute("aria-selected", String(index === active)));
      options[active]?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      options[active].click();
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".search")) close();
  });
}

function haystack(event) {
  return [event.title, event.shortTitle, event.summary, ...(event.topics || []), ...(event.keywords || []), ...(event.scripture || []), event.kind]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function setupHelp() {
  const scrim = document.getElementById("help-scrim");
  const open = () => {
    scrim.hidden = false;
    document.getElementById("help-close").focus();
  };
  const close = () => {
    scrim.hidden = true;
    document.getElementById("help-button").focus();
  };
  document.getElementById("help-button").addEventListener("click", open);
  document.getElementById("help-close").addEventListener("click", close);
  scrim.addEventListener("click", (event) => {
    if (event.target === scrim) close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !scrim.hidden) {
      close();
      return;
    }
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
}

function setupBanner() {
  try {
    if (sessionStorage.getItem("timeline-banner") === "hide") banner.hidden = true;
  } catch {
    /* private mode */
  }
  document.getElementById("dismiss-banner").addEventListener("click", () => {
    banner.hidden = true;
    try {
      sessionStorage.setItem("timeline-banner", "hide");
    } catch {
      /* private mode */
    }
  });
  document.getElementById("jump-creation").addEventListener("click", () => fitChapter("primeval"));
  document.getElementById("jump-egypt").addEventListener("click", () => fitChapter("egypt-near-east"));
}

function setupPointer() {
  const pointers = new Map();
  let drag = null;

  const capture = (pointerId) => {
    try {
      viewport.setPointerCapture(pointerId);
    } catch {
      /* pointer already released */
    }
  };

  viewport.addEventListener("pointerdown", (event) => {
    if (event.button != null && event.button !== 0) return;
    if (event.target.closest(".zoom-controls") || event.target.closest(".legend")) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    state.pointerDown = true;
    cancelAnim();
    hideTip();
    if (pointers.size === 1) {
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, t: state.camera.t, moved: false, pinch: false };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      drag = {
        pinch: true,
        dist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        zoom: state.camera.zoom,
        midT: tAtClient((a.x + b.x) / 2),
      };
      for (const id of pointers.keys()) capture(id);
    }
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!pointers.has(event.pointerId) || !drag) {
      if (event.pointerType !== "touch") moveTip(event);
      return;
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size >= 2 && drag.pinch) {
      const [a, b] = [...pointers.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const midX = (a.x + b.x) / 2;
      setZoomKeepingT(drag.midT, midX, drag.zoom * (dist / drag.dist));
      state.suppressClick = true;
      return;
    }
    if (!drag.pinch && event.pointerId === drag.id) {
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!drag.moved && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
        drag.moved = true;
        capture(event.pointerId);
      }
      if (!drag.moved) return;
      const worldWidth = viewport.clientWidth * state.camera.zoom;
      state.camera.t = drag.t - dx / worldWidth;
      clampCamera();
      render();
    }
  });

  const end = (event) => {
    pointers.delete(event.pointerId);
    if (drag && !drag.pinch && drag.moved) state.suppressClick = true;
    if (pointers.size === 0) {
      drag = null;
      state.pointerDown = false;
    }
    setTimeout(() => {
      state.suppressClick = false;
    }, 0);
  };
  viewport.addEventListener("pointerup", end);
  viewport.addEventListener("pointercancel", end);
  viewport.addEventListener("pointerleave", hideTip);

  viewport.addEventListener("wheel", (event) => {
    event.preventDefault();
    cancelAnim();
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) && !event.ctrlKey) {
      const worldWidth = viewport.clientWidth * state.camera.zoom;
      state.camera.t += event.deltaX / worldWidth;
      clampCamera();
      render();
      return;
    }
    const factor = Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.0014));
    zoomBy(factor, event.clientX);
  }, { passive: false });

  viewport.addEventListener("keydown", (event) => {
    const step = 0.06 / state.camera.zoom;
    if (event.key === "ArrowRight") state.camera.t += step;
    else if (event.key === "ArrowLeft") state.camera.t -= step;
    else if (event.key === "+" || event.key === "=") zoomBy(1.25);
    else if (event.key === "-" || event.key === "_") zoomBy(0.8);
    else if (event.key === "Home") animateTo({ t: 0.5, zoom: 1 });
    else return;
    event.preventDefault();
    clampCamera();
    render();
  });

  document.getElementById("zoom-in").addEventListener("click", () => zoomBy(1.35));
  document.getElementById("zoom-out").addEventListener("click", () => zoomBy(1 / 1.35));
  document.getElementById("zoom-fit").addEventListener("click", () => animateTo({ t: 0.5, zoom: 1 }));

  viewport.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch") return;
    moveTip(event);
  });
}

function moveTip(event) {
  if (state.pointerDown) {
    hideTip();
    return;
  }
  const host = event.target.closest?.("[data-id]");
  const item = host ? eventsById.get(host.dataset.id) : null;
  if (!item) {
    hideTip();
    return;
  }
  showTip(item, event.clientX, event.clientY);
}

function showTip(eventItem, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  tooltip.hidden = false;
  tooltip.replaceChildren(
    badge(eventItem.category),
    el("strong", { text: eventItem.title }),
    el("p", { text: `${formatWhen(eventItem)}. ${eventItem.summary}` }),
  );
  const margin = 12;
  let x = clientX - rect.left + 14;
  let y = clientY - rect.top + 18;
  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
  const box = tooltip.getBoundingClientRect();
  if (box.right > rect.right - margin) x -= box.width + 28;
  if (box.bottom > rect.bottom - margin) y -= box.height + 28;
  tooltip.style.left = `${Math.max(8, x)}px`;
  tooltip.style.top = `${Math.max(8, y)}px`;
}

function hideTip() {
  tooltip.hidden = true;
}

function setupMinimap() {
  let drag = null;
  minimapTrack.replaceChildren(
    ...chapters.map((chapter, index) => {
      const seg = el("div", { class: "minimap-seg" });
      seg.style.left = `${chapter.t0 * 100}%`;
      seg.style.width = `${(chapter.t1 - chapter.t0) * 100}%`;
      seg.style.background = index % 2 === 0 ? "#e7c98a" : "#9fd0c8";
      return seg;
    }),
  );
  const tFor = (clientX) => {
    const rect = minimap.getBoundingClientRect();
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
  };
  minimap.addEventListener("pointerdown", (event) => {
    minimap.setPointerCapture(event.pointerId);
    drag = { t: tFor(event.clientX) };
    state.camera.t = drag.t;
    clampCamera();
    render();
  });
  minimap.addEventListener("pointermove", (event) => {
    if (!drag) return;
    state.camera.t = tFor(event.clientX);
    clampCamera();
    render();
  });
  minimap.addEventListener("pointerup", () => {
    drag = null;
  });
}

async function main() {
  const [eventFile, bookFile] = await Promise.all([
    fetch("data/events.json").then((response) => response.json()),
    fetch("data/books.json").then((response) => response.json()),
  ]);
  chapters = indexChapters(eventFile.chapters);
  eras = eventFile.eras;
  events = eventFile.events;
  indexPositions();
  books = bookFile.books;
  eventsById = new Map(events.map((event) => [event.id, event]));
  buildStatic();
  setupEras();
  setupParent();
  setupSearch();
  setupHelp();
  setupBanner();
  setupPointer();
  setupMinimap();
  updatePathCount();
  new ResizeObserver(() => render()).observe(viewport);
  render();
  loading.hidden = true;
  const hash = decodeURIComponent(location.hash.replace(/^#/, ""));
  if (eventsById.has(hash)) focusEvent(hash, true);
  if (document.fonts?.ready) document.fonts.ready.then(() => render());
}

main().catch((error) => {
  console.error(error);
  loading.textContent = "The timeline data could not be loaded.";
});
