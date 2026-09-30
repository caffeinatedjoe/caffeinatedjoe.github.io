#!/usr/bin/env node
/**
 * Check timeline JSON before adding content.
 * Run from the repo root: node timeline/validate.js
 */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "data");
const eventsDoc = JSON.parse(fs.readFileSync(path.join(root, "events.json"), "utf8"));
const booksDoc = JSON.parse(fs.readFileSync(path.join(root, "books.json"), "utf8"));

const errors = [];
const fail = (message) => errors.push(message);

const categories = new Set(["scripture", "historical", "interpretation"]);
const kinds = new Set(["person", "event", "civilization", "period", "culture"]);
const bases = new Set(["historical", "approximate"]);
const levels = new Set(["read-aloud", "early-reader", "independent", "advanced"]);
const types = new Set(["fiction", "nonfiction"]);
const bannedTitles = [
  /gilgamesh the hero/i,
  /mara,\s*daughter of the nile/i,
  /mara daughter of the nile/i,
  /story of the world/i,
  /mummies in the morning/i,
  /mummies and pyramids/i,
  /viking ships at sunrise/i,
  /mummies made in egypt/i,
  /bobbin girl/i,
  /slave dancer/i,
  /across america on an emigrant train/i,
];
const lambertTitles = [
  "America: Our Stories, Volume 1",
  "Our Neighbors: Their Stories, Volume 1",
  "America: Our Stories, Volume 2",
  "Our Neighbors: Our Stories, Volume 2",
];

const { chapters, eras, events } = eventsDoc;
const books = booksDoc.books;

if (!Array.isArray(chapters) || !chapters.length) fail("chapters missing");
for (const chapter of chapters) {
  if (!(chapter.weight > 0)) fail(`chapter ${chapter.id} needs a positive weight`);
}

const eraIds = new Set();
for (const era of eras) {
  if (eraIds.has(era.id)) fail(`duplicate era ${era.id}`);
  eraIds.add(era.id);
}

const ids = new Set();
const sortKeys = new Set();
for (const event of events) {
  if (ids.has(event.id)) fail(`duplicate event ${event.id}`);
  ids.add(event.id);
  if (!event.title || !event.summary || !Array.isArray(event.context) || !event.context.length) {
    fail(`event ${event.id} needs title, summary, and context`);
  }
  if (!kinds.has(event.kind)) fail(`event ${event.id} has bad kind`);
  if (!categories.has(event.category)) fail(`event ${event.id} has bad category ${event.category}`);
  if (event.category === "today") fail(`event ${event.id} uses the removed today category`);
  if (event.dateBasis != null && !bases.has(event.dateBasis)) fail(`event ${event.id} has bad dateBasis`);
  if (!event.era || typeof event.era !== "string") fail(`event ${event.id} needs an era label`);
  if (!eraIds.has(event.eraId)) fail(`event ${event.id} has unknown eraId ${event.eraId}`);
  if (typeof event.sortKey !== "number") fail(`event ${event.id} needs a numeric sortKey`);
  if (sortKeys.has(event.sortKey)) fail(`duplicate sortKey ${event.sortKey}`);
  sortKeys.add(event.sortKey);
  if (event.startYear != null && !Number.isInteger(event.startYear)) {
    fail(`event ${event.id} startYear must be an integer or null`);
  }
  if (event.endYear != null && !Number.isInteger(event.endYear)) fail(`event ${event.id} endYear must be an integer`);
  if (event.year != null && typeof event.year !== "string") fail(`event ${event.id} year must be a display string or null`);
  if (event.category === "scripture" || event.category === "interpretation") {
    if (event.startYear != null || event.endYear != null) {
      fail(`${event.category} event ${event.id} must keep startYear null`);
    }
    if (event.dateBasis != null || event.year != null) {
      fail(`${event.category} event ${event.id} must keep dateBasis and year null`);
    }
  }
  if (event.category === "historical" && event.dateBasis === "historical" && !Number.isInteger(event.startYear)) {
    fail(`event ${event.id} dateBasis historical needs an integer startYear`);
  }
  if (event.category === "historical" && event.dateBasis !== "historical") {
    if (event.startYear != null || event.endYear != null) {
      fail(`event ${event.id} is century-only or undated and must keep startYear null`);
    }
  }
  if (![1, 2, 3, 4].includes(event.importance)) fail(`event ${event.id} importance must be 1-4`);
  if (event.category === "interpretation") {
    const text = `${event.summary} ${(event.context || []).join(" ")}`;
    if (!/interpretation|not a settled fact|not settled|not scripture|not verified|does not decide|not a chronicle|not history/i.test(text)) {
      fail(`interpretation ${event.id} should say it is not settled fact`);
    }
  }
}

const greece = events.filter((event) => event.eraId === "greece").sort((a, b) => a.sortKey - b.sortKey);
if (!greece.length || greece[0].sortKey !== 112 || greece[0].id !== "gr-athens-sparta") {
  fail("the first Greece marker must be gr-athens-sparta at sortKey 112");
}

const israelKeys = events
  .filter((event) => event.eraId === "israel")
  .map((event) => event.sortKey)
  .sort((a, b) => a - b);
const expectedIsrael = [105, 106, 107, 108, 109, 110, 111];
if (israelKeys.join(",") !== expectedIsrael.join(",")) {
  fail(`Israel sortKeys must be 105–111, got ${israelKeys.join(", ")}`);
}

const pyramid = events.find((event) => event.id === "great-pyramid");
if (!pyramid) fail("missing great-pyramid");
else {
  if (pyramid.category !== "historical") fail("Khufu / Great Pyramid must be historical");
  if (pyramid.startYear != null || pyramid.endYear != null) fail("Khufu must not have an integer year");
  if (pyramid.dateBasis !== "approximate") fail("Khufu dateBasis must be approximate");
  if (!/early 25th century BCE/.test(pyramid.year || pyramid.yearLabel || "")) {
    fail("Khufu year must stay the display text: early 25th century BCE");
  }
}

if (events.length !== 54) fail(`expected 54 events, found ${events.length}`);

for (const event of events) {
  for (const related of event.relatedIds || []) {
    if (!ids.has(related)) fail(`${event.id} related id missing: ${related}`);
  }
}

const bookIds = new Set();
const bookTitles = new Set();
for (const book of books) {
  if (bookIds.has(book.id)) fail(`duplicate book ${book.id}`);
  bookIds.add(book.id);
  bookTitles.add(book.title);
  if (!book.title || !book.author || !book.blurb) fail(`book ${book.id} needs title, author, and blurb`);
  if (bannedTitles.some((pattern) => pattern.test(book.title))) fail(`excluded book: ${book.title}`);
  if (!types.has(book.type)) fail(`book ${book.id} has bad type`);
  if (!(book.ageMin <= book.ageMax)) fail(`book ${book.id} has a bad age range`);
  if (!Array.isArray(book.levels) || !book.levels.length || book.levels.some((level) => !levels.has(level))) {
    fail(`book ${book.id} has bad levels`);
  }
  if (!Array.isArray(book.eventIds)) fail(`${book.id} needs eventIds`);
  if (book.primaryEventId && !book.eventIds.includes(book.primaryEventId)) {
    fail(`${book.id} primary event is not in eventIds`);
  }
  if (!book.eventIds.length && !(book.era || book.eraId)) fail(`${book.id} needs an event or an era`);
  for (const eventId of book.eventIds) {
    if (!ids.has(eventId)) fail(`${book.id} points at missing event ${eventId}`);
  }
}

if (books.length !== 49) fail(`expected 49 books, found ${books.length}`);

for (const title of lambertTitles) {
  if (!bookTitles.has(title)) fail(`missing Lambert title: ${title}`);
}

for (const title of ["Hittite Warrior", "The Days of Elijah", "Kids at Work"]) {
  const book = books.find((item) => item.title === title);
  if (!book) fail(`missing preview book ${title}`);
  else if (!book.previewOnly || !book.parentNote) fail(`${title} must be previewOnly with a parentNote`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`OK: ${events.length} events, ${books.length} books, ${chapters.length} chapters`);
