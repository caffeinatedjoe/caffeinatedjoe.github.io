# Creation to Today

An interactive timeline for children, from Creation to the present. Scripture, documented history, and interpretations are different kinds of markers. Clicking one opens a short explanation and, when we have them, real children's books.

The page is static. GitHub Pages can serve it at `/timeline/` with no build step.

## For people adding content

Edit the JSON. Do not invent books, dates, or events. If a date is traditional, uncertain, or moved so it sits after the Flood on this map, say so in the fields below. The page turns those fields into badges.

Check the files before you commit:

```bash
node timeline/validate.js
```

### `data/events.json`

Top-level keys:

| Key | Purpose |
| --- | --- |
| `meta.minYear` / `meta.maxYear` | Edges of the map. Chapters must cover this range with no gaps. |
| `chapters` | Background bands. Time is **not** an equal number of pixels per year. Each chapter gets a share of the width from its `weight`, and years are linear inside the chapter. Ancient centuries are packed closer so Creation and today fit together. Zoom spreads them out. |
| `eras` | The period buttons and the parent filter. Ranges may overlap. `id` is what books and events point at. |
| `events` | Every marker and ribbon. |

Each event:

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Stable slug. Books and `relatedIds` use it. |
| `title` | yes | Full name in the panel. |
| `shortTitle` | no | Map label. Defaults to `title`. |
| `kind` | yes | `person`, `event`, `civilization`, `period`, or `culture`. Civilizations, periods, and cultures with an `endYear` draw as ribbons. People and events draw as dots. A person with a life span is still a dot, placed at the middle year. The panel shows the whole span. |
| `category` | yes | `scripture` (the Bible tells this), `historical` (records tell this), `interpretation` (a proposed date or connection, not settled fact), or `today` (only the present-day pin). |
| `alsoHistorical` | no | Adds a Historical badge on a Scripture marker, as with the fall of Samaria. |
| `alsoInScripture` | no | Adds a Scripture badge on a historical marker, as with Sennacherib in 701 BC. |
| `era` | yes | One era id. This is what the parent period filter uses. |
| `startYear` | yes | Integer. Negative means BC. There is no year 0; the scale simply steps from -1 to 1. |
| `endYear` | no | Include it for a span. Ribbons need it. |
| `dateBasis` | yes | `historical` (no extra chip), `traditional-chronology` (chip: Traditional date), `approximate` (chip: Date uncertain), `chronology-alignment` (chip: Placed after the Flood). |
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

Chronology already in the seed:

- Creation **4004 BC** and the Flood **2348 BC** are James Ussher's dates. The Bible gives the story and the genealogies, not those BC numbers.
- From Abraham through the Exodus, years follow a common conservative count with the Exodus in **1446 BC** (1 Kings 6:1). A separate interpretation marker shows the other common idea, an Exodus near **1250 BC**.
- The pyramids and the start of the Egypt bar are kept **after** this map's Flood. Panels give the usual textbook dates and label the placement as interpretation.
- From the kings of Israel onward, dates mostly match ordinary history books.

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
  "eventIds": ["pyramids", "ancient-egypt"],
  "primaryEventId": "pyramids",
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
| `parentNote` | Omit the field if you have nothing to flag. |

Only add books that really exist, with the real author. A title you are unsure of does not go in.

## How the page behaves

- Drag to move. Scroll or pinch to zoom. The buttons zoom in, zoom out, and fit everything.
- Period buttons frame that era.
- Parent tools filter by age, reading level, fiction or nonfiction, period, and topic. Reading path is the filtered list in timeline order.
- A hash such as `/timeline/#joseph` opens that marker.

Weights and zoom thresholds live in `data/events.json` (`chapters[].weight`) and `js/timeline.js` (`ZOOM_BREAKS`). Importance `3` is meant to show up when someone jumps to Egypt.
