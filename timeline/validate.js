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

const categories = new Set(["scripture", "historical", "interpretation", "today"]);
const kinds = new Set(["person", "event", "civilization", "period", "culture"]);
const bases = new Set(["historical", "traditional-chronology", "approximate", "chronology-alignment"]);
const levels = new Set(["read-aloud", "early-reader", "independent", "advanced"]);
const types = new Set(["fiction", "nonfiction"]);

const { meta, chapters, eras, events } = eventsDoc;
const books = booksDoc.books;

if (!Array.isArray(chapters) || !chapters.length) fail("chapters missing");
if (chapters[0].startYear !== meta.minYear) fail("first chapter must start at meta.minYear");
if (chapters[chapters.length - 1].endYear !== meta.maxYear) fail("last chapter must end at meta.maxYear");
for (let i = 0; i < chapters.length; i += 1) {
  const chapter = chapters[i];
  if (chapter.endYear <= chapter.startYear) fail(`chapter ${chapter.id} has a bad range`);
  if (!(chapter.weight > 0)) fail(`chapter ${chapter.id} needs a positive weight`);
  if (i > 0 && chapter.startYear !== chapters[i - 1].endYear) {
    fail(`gap or overlap between ${chapters[i - 1].id} and ${chapter.id}`);
  }
}

const eraIds = new Set();
for (const era of eras) {
  if (eraIds.has(era.id)) fail(`duplicate era ${era.id}`);
  eraIds.add(era.id);
  if (era.endYear <= era.startYear) fail(`era ${era.id} has a bad range`);
}

const ids = new Set();
for (const event of events) {
  if (ids.has(event.id)) fail(`duplicate event ${event.id}`);
  ids.add(event.id);
  if (!event.title || !event.summary || !Array.isArray(event.context) || !event.context.length) {
    fail(`event ${event.id} needs title, summary, and context`);
  }
  if (!kinds.has(event.kind)) fail(`event ${event.id} has bad kind`);
  if (!categories.has(event.category)) fail(`event ${event.id} has bad category`);
  if (!bases.has(event.dateBasis)) fail(`event ${event.id} has bad dateBasis`);
  if (!eraIds.has(event.era)) fail(`event ${event.id} has unknown era ${event.era}`);
  if (!Number.isInteger(event.startYear)) fail(`event ${event.id} startYear must be an integer`);
  if (event.endYear != null && !Number.isInteger(event.endYear)) fail(`event ${event.id} endYear must be an integer`);
  if (event.endYear != null && event.endYear < event.startYear) fail(`event ${event.id} ends before it starts`);
  if (event.startYear < meta.minYear || (event.endYear ?? event.startYear) > meta.maxYear) {
    fail(`event ${event.id} is outside the map`);
  }
  if (![1, 2, 3, 4].includes(event.importance)) fail(`event ${event.id} importance must be 1-4`);
  if (event.category === "interpretation" && !/interpretation|not a settled fact|not settled|guess|idea/i.test(event.context.join(" ") + event.summary)) {
    fail(`interpretation ${event.id} should say it is not settled fact`);
  }
}

for (const event of events) {
  for (const related of event.relatedIds || []) {
    if (!ids.has(related)) fail(`${event.id} related id missing: ${related}`);
  }
}

const bookIds = new Set();
for (const book of books) {
  if (bookIds.has(book.id)) fail(`duplicate book ${book.id}`);
  bookIds.add(book.id);
  if (!book.title || !book.author || !book.blurb) fail(`book ${book.id} needs title, author, and blurb`);
  if (!types.has(book.type)) fail(`book ${book.id} has bad type`);
  if (!(book.ageMin <= book.ageMax)) fail(`book ${book.id} has a bad age range`);
  if (!Array.isArray(book.levels) || !book.levels.length || book.levels.some((level) => !levels.has(level))) {
    fail(`book ${book.id} has bad levels`);
  }
  if (!book.eventIds.includes(book.primaryEventId)) fail(`${book.id} primary event is not in eventIds`);
  for (const eventId of book.eventIds) {
    if (!ids.has(eventId)) fail(`${book.id} points at missing event ${eventId}`);
  }
}

const spine = ["creation", "flood", "babel", "abraham", "joseph", "exodus", "david", "fall-of-jerusalem", "jesus-birth", "crucifixion", "resurrection", "fall-of-rome", "luther", "columbus", "american-revolution", "civil-war", "world-war-ii", "today"];
for (const id of spine) {
  const event = events.find((item) => item.id === id);
  if (!event) fail(`missing spine event ${id}`);
  else if (event.importance !== 1) fail(`spine event ${id} should be importance 1`);
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(`OK: ${events.length} events, ${books.length} books, ${chapters.length} chapters`);
