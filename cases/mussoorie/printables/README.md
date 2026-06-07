# Printables — Murder in Mussoorie

Player-facing evidence exhibits designed in HTML with print styles (CBI vintage aesthetic).

Each evidence item has its own self-contained HTML file. The app renders that standalone file when the evidence is revealed, so detectives cannot scroll into unrevealed evidence from the same round.

The four `RoundN_*.html` files remain the editable source bundles and print-all-round versions. Run `npm run printables:split` after changing a source bundle to regenerate the 30 standalone exhibits. CI can verify they are current with `npm run printables:check`.

## Source bundles

| File | Round | Evidence items |
|---|---|---|
| `Round1_The_Scene.html` | Round 1: The Scene | 6 |
| `Round2_Suspects_Crack.html` | Round 2: Suspects' Stories Crack | 9 |
| `Round3_Thakur_Connection.html` | Round 3: The Thakur Connection | 9 |
| `Round4_The_Solve.html` | Round 4: The Solve | 6 |

## Print tips

- Use **plain white A4** paper (or letter — the layout fits both).
- Set the browser print margins to **Default**; don't enable headers/footers.
- The pages are designed to break cleanly between evidence cards.
- Open a standalone evidence file to print only that exhibit.
- Open a round source bundle to print a complete physical packet.

## Reusing across cases

These printables are **Mussoorie-specific**. Future cases should map every evidence item to its own standalone `printableHtml` file.
