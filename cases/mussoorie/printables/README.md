# Printables — Murder in Mussoorie

Player-facing evidence exhibits designed in HTML with print styles (CBI vintage aesthetic).

Each evidence item has its own self-contained HTML file. The app renders that standalone file when the evidence is revealed, so detectives cannot scroll into unrevealed evidence from the same round.

The four `RoundN_*.html` files remain the editable source bundles and print-all-round versions. Run `npm run printables:split` after changing a source bundle to regenerate the 33 standalone exhibits. CI verifies they are current with `npm run printables:check`.

The app serves only standalone exhibits unlocked for an authenticated session. Round source bundles are for local author/host preparation and are not served through the player printable route. The app has no PDF export control. The author/host Devraj packet can be generated separately as described below.

## Source bundles

| File | Round | Evidence items |
|---|---|---|
| `Round1_The_Scene.html` | Round 1: The Scene | 6 |
| `Round2_Suspects_Crack.html` | Round 2: Suspects' Stories Crack | 9 |
| `Round3_Thakur_Connection.html` | Round 3: The Thakur Connection | 9 |
| `Round4_The_Solve.html` | Round 4: The Solve | 9 |

## Print tips

- Use **plain white A4** paper (or letter — the layout fits both).
- Set the browser print margins to **Default**; don't enable headers/footers.
- The pages are designed to break cleanly between evidence cards.
- Open a standalone evidence file to print only that exhibit.
- Open a round source bundle to print a complete physical packet.

## Reusing across cases

These printables are **Mussoorie-specific**. Future cases should map every evidence item to its own standalone `printableHtml` file.

## Devraj recall packet

`python3 scripts/render-devraj-packet.py` (from the repository root, with ReportLab
installed) produces `output/pdf/Devraj_Second_Interview_Evidence.pdf`: a request
sheet, call record, handset location examination, duty-register audit and
issued-lathi examination. All pages are fictional game documents. Keep the full
packet with the host and release only requested report pages after Devraj’s recall.

The four corresponding HTML reports are also styled for the in-game evidence
viewer. `node scripts/style-devraj-exhibits.mjs` refreshes those source blocks from
the case lore; then run `npm run printables:split`. The PDF is separately authored:
when case facts change, update its renderer and visually inspect every page.
