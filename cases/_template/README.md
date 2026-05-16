# Case template

Copy this folder to start a new case.

```bash
cp -r cases/_template cases/your-case-id
# then edit cases/your-case-id/case.json
npm run validate-case your-case-id
```

The `case.json` here is a minimal valid case (3 suspects, 4 chapters, 1 evidence item, 2 rounds). It will validate green out of the box, then turn yellow with warnings about missing asset files (because you haven't created portraits yet). Replace every `TODO:` marker with your content.

See [`docs/authoring-guide.md`](../../docs/authoring-guide.md) for the full guide.

## Folder structure

```
cases/your-case-id/
├── case.json
├── design.md            # your case bible (canonical, spoiler-heavy source of truth)
├── assets/
│   ├── portraits/
│   ├── locations/
│   ├── crime-scene/
│   ├── audio/
│   └── ui/
└── printables/
```
