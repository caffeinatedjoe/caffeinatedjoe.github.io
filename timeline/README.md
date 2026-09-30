# Creation to Today

An interactive timeline for children, from Creation to the present. Scripture, documented history, and interpretations are different kinds of markers. Clicking one opens a short explanation and, when we have them, real children's books.

The page is static. GitHub Pages can serve it at `/timeline/` with no build step.

## For people adding content

Edit the JSON. Do not invent books or years. Scripture does not need a year. The page places markers by `sortKey` inside each chapter, and it prints `year` when a source gives display text. A null `startYear` is valid. Do not fill one in to satisfy a checker.

Check the files before you commit:

```bash
node timeline/validate.js
```

### `data/events.json`

Top-level keys:

| Key | Purpose |
| --- | --- |
| `meta.placement` | `sortKey`. Markers are ordered by story, not by an invented year. |
| `chapters` | Background bands, one per era. Each chapter's `weight` is its share of the width. |
| `eras` | The period buttons and the parent filter. `id` matches the chapter id. `sortKey` is the era order. |
| `events` | Every marker. |

Each event:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable slug. Books and `relatedIds` use it. |
| `title` | yes | Full name in the panel. |
| `shortTitle` | no | Map label. Defaults to `title`. |
| `kind` | yes | `person`, `event`, `civilization`, `period`, or `culture`. The seed uses `event` dots. |
| `category` | yes | Only three: `scripture`, `historical`, or `interpretation`. |
| `era` | yes | Fine label from the seed, such as `creation` or `egypt`. It is not the chapter id. |
| `eraId` | yes | Chapter id. Markers in one chapter are spaced by `sortKey`. The parent period filter uses this id. |
| `sortKey` | yes | Number. Global story order. Israel uses 105–111. The first Greece marker is `gr-athens-sparta` at `112`. |
| `startYear` | no | Integer, or `null`. **Null is allowed.** Scripture, interpretation, and century-only history stay `null`. Do not invent a BC year. Store an integer only when the source states that year or an explicit numeric range. |
| `endYear` | no | Integer end of a verified range, such as 1861–1865. Leave it null when the label is a century or a phrase. |
| `year` | no | The date words to show, copied from the source, or `null`. Khufu's text is `early 25th century BCE`. This is panel text, not a plot number. |
| `dateBasis` | no | `historical` when `startYear` is a verified year. `approximate` when the display year is a century or range and `startYear` is null. `null` for Scripture, interpretation, and undated history. `null` draws no date chip. |
| `importance` | yes | `1` shows on the full map. `2` appears after a little zoom. `3` appears on an era jump such as Egypt. `4` appears only when zoomed in close. |
| `summary` | yes | One sentence for the hover tip. |
| `context` | yes | Array of short paragraphs for children. |
| `yearNote` | no | Shown under the date. Use it whenever the year is not printed in the source. |
| `textbookNote` | no | Callout for a conflicting museum or textbook date. Required when a marker is deliberately not plotted at the textbook year. |
| `scripture` | no | References such as `"Genesis 37-50"`. |
| `topics` | no | Used by search. |
| `keywords` | no | Extra search words. |
| `relatedIds` | no | Other event ids for the "Keep exploring" buttons. |

Interpretation markers must say, in the summary or context, that the claim is not settled fact. The validator checks for that.

The remapped seed is `chunks/remap-branch-fields.json` (54 events, 49 books). `data/events.json` and `data/books.json` are what the page loads.

- Scripture markers have `startYear: null`, `dateBasis: null`, and `year: null`. The Bible's story is not given a BC number, and the page does not draw a date chip.
- Khufu and the Great Pyramid are **historical**. `year` is `early 25th century BCE`, `dateBasis` is `approximate`, and `startYear` is `null`.
- Interpretation markers also keep `startYear`, `dateBasis`, and `year` null. They must say they are not settled fact. The page does not pick an Exodus pharaoh or an Exodus year.
- Century-only history, such as "5th century BCE", keeps `startYear` null. The words in `year` are what the panel shows.
- Do not add Gilgamesh the Hero; Mara, Daughter of the Nile; Story of the World volumes 1–4; Mummies in the Morning; Mummies and Pyramids; Viking Ships at Sunrise; Mummies Made in Egypt; or The Bobbin Girl.
- Keep these Lambert titles distinct: *America: Our Stories, Volume 1*; *Our Neighbors: Their Stories, Volume 1*; *America: Our Stories, Volume 2*; *Our Neighbors: Our Stories, Volume 2*.
- *Hittite Warrior*, *The Days of Elijah*, and *Kids at Work* are `previewOnly`. They need a `parentNote`. They stay off the reading path and off marker book lists until a parent opens Parent tools.

Do not teach evolution as the origin of the world. Do not add vulgar, sexual, or curse-heavy books.

### `data/books.json`

```json
{
  "id": "pyramid-mac",
  "title": "Pyramid",
  "author": "David Macaulay",
  "type": "nonfiction",
  "ageMin": 8,
  "ageMax": 14,
  "levels": ["read-aloud", "independent"],
  "topics": ["egypt"],
  "eventIds": ["great-pyramid"],
  "primaryEventId": "great-pyramid",
  "eraId": "egypt-near-east",
  "blurb": "One sentence on why this book belongs here.",
  "parentNote": "Optional. Use for war, slavery, myths, older attitudes, or fiction that could be mistaken for a source."
}
```

| Field | Notes |
| --- | --- |
| `type` | `fiction` or `nonfiction`. Bible retellings are nonfiction. Novels are fiction. Myths are fiction, with a parent note. |
| `levels` | Any of `read-aloud`, `early-reader`, `independent`, `advanced`. |
| `eventIds` | Every marker where the book should appear. |
| `primaryEventId` | Must be one of `eventIds`. The reading path lists each book once, under this event, in timeline order. |
| `topics` | Parent topic filter. Reuse the topics already in the file when you can. |
| `parentNote` | Omit the field if you have nothing to flag. Required when `previewOnly` is true. |
| `previewOnly` | If true, the book is hidden until Parent tools are on. |

Only add books that really exist, with the real author. A title you are unsure of does not go in.

## How the page behaves

- Drag to move. Scroll or pinch to zoom. The buttons zoom in, zoom out, and fit everything.
- Period buttons frame that era.
- Parent tools filter by age, reading level, fiction or nonfiction, period, and topic. Reading path is the filtered list in timeline order.
- A hash such as `/timeline/#joseph` opens that marker.

Weights and zoom thresholds live in `data/events.json` (`chapters[].weight`) and `js/timeline.js` (`ZOOM_BREAKS`). Importance `3` is meant to show up when someone jumps to Egypt.
