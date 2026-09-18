# Gameplay visual assessment

Assessment of current source, all 19 authored chapters, 30 exhibit definitions, printable examples, image dimensions, and selected artwork. This is a source-and-asset review, not a new browser playthrough. Recommendations below describe the original plan; the delivery note records what has since been implemented.

## Delivery update

Case picker and landing now use the illustrated poster, portrait gallery, game details, and hosting action. Host setup, TV lobby, code entry (`/join`), phone registration, and waiting screens now share that visual style. The lobby includes a QR code, copyable link, eight case-configured seat cards, live joined counts, initials badges, and localhost guidance. Phone waiting includes a detective/observer credential. Verified create, join, rejoin, invalid-code feedback, live roster, and start-to-briefing in the browser using the isolated local database; build, lint, 140 unit tests (one skipped), and 122 integration assertions passed. Physical phone QR scanning remains unverified.

Arrival and briefing now use a generated police-station establishing shot, schematic arrival route, Vikram’s existing portrait and public background, and matching TV/phone assignment panels. Only the active location is projected to clients. Verified production rendering at desktop and 390px phone width, 141 unit tests (one skipped), 122 integration assertions, lint, case validation, and production build. Artwork and its exact generation prompt are in `cases/mussoorie/assets/locations/`.

The first anonymous letter now has a shared TV/phone reveal: envelope illustration, postmark and receipt details, original authenticated exhibit, case-note toggle, and full-page reading link. Presentation requires the active letter chapter and unlocked exhibit. Removed a premature author-identity spoiler from public notes and aligned the source/standalone printable postmark to Dehradun. Verified browser rendering and note switching, 142 passing unit tests (one skipped), 122 integration assertions, printable consistency, case validation, lint, and production build.

The crime-scene chapter now has a generated ravine overview, selectable railing/tripod/missing-shoe observations, and a scene-summary/police-report comparison with original document access. The old source sketch’s conflicting positions and speculative deductions were replaced with the established case observations; the standalone printable was regenerated. Artwork is served through an authenticated, unlock-gated endpoint with private/no-store caching. Verified desktop and 390px phone rendering, control interactions, 142 unit tests (one skipped), 132 integration assertions including the new image-access boundary, printable consistency, case validation, lint, and production build.

## Remaining visual pass — delivered

The remaining chapter treatments are implemented on both host and player views. The original recommendations below are retained as assessment history, not an open backlog.

| Area | Delivered treatment |
|---|---|
| Who Was Vikram? | Cottage study, victim portrait, creator-channel card, Grey Lady illustration, rendered working-wall notes and released sources. |
| The Six | Six portrait dossiers with expandable known information, restricted to released exhibits. |
| Building the File / all evidence | Shared filterable thumbnail gallery, selected-exhibit focus, readable notes, original document viewer, full-page link, persistent per-device unreviewed badges. |
| Interviews / discovery | Larger portrait against a neutral interview setting, active detective, latest exchange, expandable older TV transcript, presented exhibit, phone preview, committed-evidence gallery. Newly released evidence takes focus after the server publishes it. |
| Second letter | Distinct envelope, Bangalore postmark, anonymous provenance, corrected original letter and notes. |
| Fifteen Years Ago | Thakur Cottage establishing shot, archival newspaper, side-by-side empty mount and rifle, rendered ownership trail and original sources. |
| Recontextualised | Portrait/source dossiers, released evidence board, private unsaved theory scratchpad. No automatic guilt connections. |
| Victim’s phone | Clearly labelled recovered-file review with working Messages, Calls and Notes tabs. No simulated hacking progress or unsupported countdown. |
| Final File | Illustrated jeep CCTV, grey shawl, call-duration card, non-graphic medical diagram, payment flow, and accessible sources. |
| Accusation | Portrait ballots, selected vote, tallies, host roster showing choosing/submitted status. |
| Confrontation | Current speaker portrait and latest authored exchange; previous exchange expandable. Existing server-controlled reveal steps retained. |
| Truth | Progressive reader-controlled timeline, actor portraits, schematic town map, location artwork and related released sources. Available only after the host reveals the truth. |
| Finished | Case-closed dossier, team roster, personal accusation recap, complete timeline and decisive exhibits. |
| Pause / reconnect / wait | Context-preserving status panel, named active detective, automatic reconnection explanation and reload action. Finished-game evidence stays readable. |
| Crime-scene refinements | Railing and tripod details, observation schematic, explicit missing-shoe marker without inventing a recovered shoe or location. |
| Optional recording | Existing video exposed only after the solution as a bonus dramatization, with a poster, readable transcript and authenticated film/caption downloads. Inline playback is deferred after embedded-browser crashes. |

Sixteen new final illustrations are saved in the case assets: eight environments and eight evidence images. Existing portraits and earlier arrival/ravine art are retained. Two draft environment variants are retained beside the corrected final versions. Exact built-in generation prompts and paths: [VISUAL_PRODUCTION.md](../cases/mussoorie/assets/VISUAL_PRODUCTION.md).

### Story and access decisions

- Added **Open research files / Next investigation file** to the host. These advance the authored Round 3–4 files in order while interviews remain free-choice. Only the host may advance research; paused games and pending turns cannot advance. This closes the previous gap where those chapters were unreachable from the UI.
- Phone files are projected only while the phone chapter is active. Solution timeline and locations are projected only at the truth step. New evidence artwork and recording routes require membership in the matching game and the appropriate unlock/reveal state; they use private/no-store caching.
- Corrected early author/killer spoilers in second-letter and working-wall notes. Aligned Round 3–4 handouts and the Rhea CCTV/pawn receipt with canonical case text; removed conflicting provenance, invented return calls, departure CCTV, plate numbers, physical detail and premature causal conclusions. Photo handouts now load their protected artwork.
- The jeep exhibit illustrates the authored **8:10 PM arrival/parked observation**. No departure frame is presented: the case does not establish one. Registration identification remains in the authored notes; no number was invented in the image.
- The optional recording’s 8:07 PM approach sighting is explicitly distinguished from the 8:10 PM Gun Hill camera observation. It is shown after the solution as a dramatization, not used as independent evidence of the driver’s identity. Existing media is preserved.
- Working-wall connections, maps, medical and ownership diagrams use rendered text and vectors. The map is schematic, not a claim about travel distances. The missing shoe remains missing. No guilt meter or fabricated team-progress mechanic was added.
- Timeline expansion and exhibit selection are local reading controls; host chapter/confrontation progression and votes remain synchronized. Theory notes are intentionally labelled unsaved. Unreviewed exhibit markers are stored per game on the device.

### Verification

Production build, lint, case validation and consistency of all 30 printables passed. Automated boundary tests and isolated-database integration checks passed. Browser checks cover desktop and 390px phone layouts and chapter interactions; physical multi-phone/TV play is not claimed. 145 unit tests passed with one skipped; 178 integration assertions passed, including research progression, spoiler/media access boundaries, downloads and both endings. Browser review also confirmed the case-closed team roster, personal accusation recap and accessible recording fallback.

## Original asset findings

- Six suspect portraits and Vikram's portrait are usable 512×512 illustrations. Suspect portraits appear in interview/selection views; the victim portrait is not supplied to gameplay clients.
- A usable 1536×1024 illustrated title poster lives in `cases/mussoorie/ui/1ac679f4-9178-43ad-8c21-5ccf90c59730.png`. The hero endpoint serves it, and the TV opening uses it. It contains baked-in title text, so cropping and overlaying another title need care.
- `assets/ui/cover.png` and **all eight location PNGs are 1×1 placeholders**. File existence does not mean finished art. Earlier documentation described their presence without catching this limitation.
- The crime-scene asset folder contains only a planning README.
- Thirty standalone HTML exhibits exist, with styled documents, messages, and frames. At least the rifle photograph and jeep CCTV use descriptive text in place of actual imagery.
- The final recording has an MP4, audio, subtitles, and a still on disk; no gameplay video player is implemented. Its script needs continuity review before release: it describes a following jeep at 8:07 PM, while the case timeline places the jeep's arrival at 8:10 PM. These could be different observations, but should be explicitly reconciled.
- Entry pages, most narrative chapters, evidence lists, accusation, and ending remain predominantly text cards. Dark panels and gold accents provide consistency, but few screens establish place, action, or a dramatic change.

## Visual direction

Use the existing illustrated hill-station noir: misty blue-green hills, warm amber lamps, charcoal shadows, cream paperwork, and restrained red evidence stamps. Keep portraits stylistically consistent. Crime-scene depictions should remain non-graphic, matching the authored family-friendly tone.

The TV should show the scene, speaker, or newly discovered exhibit at a scale readable across a room. Phones should provide inspection, readable transcripts, evidence selection, and voting. Avoid shrinking the TV composition onto a phone.

Atmospheric paintings and object images can be raster artwork. Names, timestamps, document text, map labels, voting indicators, and interface icons should remain crisp rendered text or vectors. Never make generated image text the authoritative clue.

## Opportunities throughout the game

| Stage / chapter | Visual to add | TV treatment | Phone treatment | Priority |
|---|---|---|---|---|
| Case picker and case landing | Existing poster; later a text-free landscape variant | Cinematic case cover and clear start actions | Cropped cover above concise case details | First |
| Host setup and joining | Case-file frame, detective initials/badges, joined-player slots | Large QR on a quiet high-contrast panel over artwork | A compact detective credential and joined confirmation | Next |
| Opening / Arrival | Police station exterior, illustrated Mussoorie overview, Vikram portrait | Establishing shot, then victim dossier and mission | Victim card and short briefing | First |
| The Letter | Envelope and readable anonymous letter | Envelope opens into one large exhibit | Existing letter layout with readable zoom | Next |
| The Scene | Ravine bend, damaged railing, tripod/shoe details, simple scene diagram | Wide scene with numbered evidence markers | Tap a marker to inspect an already released detail | First |
| Who Was Vikram? | Cottage study, victim portrait, creator-channel view, working wall | A short sequence introducing the person and his research | Scrollable recovered digital artifacts | First |
| The Six | All six existing portraits as dossiers | Balanced lineup with names and public descriptions | Portrait cards linking to known information | First |
| Building the File | Distinct thumbnails for paper, phone, photograph, CCTV, and testimony | Newly released exhibit takes focus; evidence tray stays secondary | Filterable evidence grid with zoomable detail | First |
| All six interviews | Existing suspect portrait, neutral interview setting, active detective indicator, presented-exhibit inset | Large portrait and latest exchange; earlier transcript collapsible | Question controls, selected evidence preview, clear waiting/active state | First |
| Discovery during interview | Brief exhibit reveal and a persistent new-item marker | Show the actual unlocked artifact after the answer commits | New evidence badge opens the artifact | First |
| A Second Letter | A second envelope/document treatment, visually distinct without implying identity | Brief focus on the letter | Accessible text and artifact view | Next |
| Fifteen Years Ago | Thakur Cottage, archival newspaper, empty mount and office rifle, land-record diagram | Archival sequence and side-by-side comparison of released exhibits | Inspect each source separately, then compare | First |
| Recontextualised | Evidence board with portrait nodes, location cards, and source-linked connections | Recap only facts established so far | Player notes or simple source-linked list | Next |
| Hack the Victim's Phone | Phone lock screen and recovered-files interface | Show team progress only when the mechanic exists | Touch-friendly puzzle or clearly labeled recovery sequence | Later: gameplay dependency |
| The Final File | Jeep CCTV frames, call log, shawl object photo, readable medical diagram, payment trail | Present key exhibits individually before returning to the board | Detailed inspection and comparison | First |
| Accusation | Portrait ballot cards and submitted-vote indicators | Six portraits, visible tally, current voting progress | Strong selected state and submission confirmation | First |
| Confrontation | Portrait of the current speaker and a restrained lighting change | One authored exchange at a time | Synchronized dialogue and speaker identity | Next |
| The Truth | Illustrated timeline/map reconstruction and links to supporting exhibits | Reveal the causal sequence progressively | Scrollable solved-case timeline | First |
| Finished | Case-closed dossier, detective roster, recap of decisive evidence | A composed closing screen | Personal accusation recap and case summary | Next |
| Pause / reconnection / waiting | Clear status overlay and active-player indicator | Preserve context beneath a readable status panel | Explicit reconnect/retry state | Next |

## Artwork production list

**Reuse first:** six suspect portraits, Vikram's portrait, existing title poster, and the current document typography/layouts. Do not generate replacement portraits merely to increase the asset count.

**Create environments:** police station, Camel's Back Road, Vikram's cottage/study, Thakur Cottage, Royal Pines, Lovely Omelette Centre, bus stand, and Cedar Grove. Start with the first four; use remaining locations when the relevant scene or released evidence calls for them. Add one shared interview backdrop. Location thumbnails can derive from the same master artwork.

**Create evidence images:** ravine overview, broken railing detail, tripod/shoe detail, Vikram's working wall, building CCTV, empty wall mount, office rifle, jeep arrival/departure frames, and grey shawl. These are discovery-critical illustrations, so check every visible object, time label, and identifier against the authored evidence. Do not introduce new clues through incidental background details.

**Build interface visuals:** schematic town map, scene diagram, evidence thumbnails, portrait dossiers, source-linked evidence board, accusation cards, and final timeline. A schematic map should not imply accurate travel distances that the story has not established.

**Optional motion after stills:** short scene dissolves, letter opening, new-evidence appearance, speaker focus, and the recovered recording once reviewed and connected to an explicit reveal stage. Avoid continuous animation while reading. Include reduced-motion behavior and subtitles for video.

## Implementation considerations

- Entry screens: `src/components/CaseCard.tsx` and `src/app/case/[caseId]/page.tsx` need cover imagery and finished player-facing copy; several pages still describe a development “Phase 2 shell.”
- Most scene work belongs in `src/components/HostLobbyView.tsx` and `src/components/PlayerLobbyView.tsx`. Reusable scene, dossier, exhibit, and timeline components would prevent two divergent visual systems.
- `src/lib/public-case.ts` currently excludes locations, the victim portrait, chapter location IDs, and the solution timeline. Add narrowly scoped public visual fields appropriate to the active stage. Do not expose the private case wholesale to make visuals easier.
- Scene artwork should follow the active chapter. Currently the narrative and evidence-reveal views do not render their location imagery.
- Future evidence images and videos need the same membership/unlock checks as printables. The generic asset route currently allows portraits, locations, and UI only; do not make spoiler assets public by adding their folders to that allowlist.
- Keep authored deductions distinct from player theories. A red connecting line or “match” highlight can answer the mystery prematurely; show only released interpretations or let players create their own links.
- Keep expressive suspect animations neutral. A guilt meter, lie detector, or incriminating facial reaction would add an unauthored source of truth.
- Prefer responsive crops and compressed images. The current portraits are 512px square: adequate for cards, but inspect quality before enlarging them across a TV.
- Validate actual image dimensions, not just filenames, to prevent 1×1 placeholders passing as completed assets again.

## Recommended delivery sequence

1. **Make the world visible:** reuse poster and portraits across entry, victim introduction, suspect lineup, and voting; replace the four highest-use location placeholders and wire chapter artwork.
2. **Make evidence tangible:** replace textual photo/CCTV stand-ins, add thumbnails and an accessible artifact viewer, and focus newly unlocked evidence on the TV.
3. **Make the ending pay off:** add speaker-led confrontation, the staged visual reconstruction, and a finished-game dossier.
4. **Add richer interaction:** map, player evidence connections, phone recovery mechanic, reviewed recording, and restrained transitions.

Review the result on both a room-distance TV and a narrow phone screen. Verify that images reveal no future clues, documents remain readable without deciphering an image, scene changes remain synchronized, and missing media has a useful fallback.

### Recording compatibility limitation

Both the original MP4 and a 720p VP9/Opus WebM caused the embedded browser to crash when loading/starting native playback. Inline playback was therefore removed from the delivered screen. The truth-only panel uses a still, transcript and downloadable MP4/captions; the original film remains unchanged. Playback in an external video player is not claimed as verified.
