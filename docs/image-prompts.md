# Image-generation prompts — Murder in Mussoorie

Drop-in prompts for ChatGPT (DALL·E 3). House style is **painterly noir**: moody oil-painting feel, soft brushwork, restrained palette, family-friendly. Specify aspect ratio in the body of the prompt; DALL·E 3 picks it up.

For each image, the **target file path** is the one the case validator expects (so the asset warnings turn off when you drop the files in). After generating, save as PNG at the listed path.

> **General style preamble** (already baked into each prompt below — included here so you can tweak if you want to regenerate the whole set):
>
> *"Painterly noir oil-painting illustration. Soft moody brushwork, restrained palette of cool greys, deep teals, and amber lamplight. Mussoorie hill-station atmosphere — cedar trees, colonial-era bungalows, mist. Family-friendly, never gory, no blood, no weapons pointed at the camera. Cinematic composition, shallow depth of field, gentle film grain."*

---

## 1. Cover art

**Path:** `cases/mussoorie/assets/ui/cover.png` · **Aspect:** 3:2 landscape

```
Create a painterly noir oil-painting cover for a cooperative detective mystery titled "Murder in Mussoorie — A Cooperative CBI Investigation". Subtitle tagline: "A YouTuber's death. A fifteen-year-old cold case. A hill town with too many secrets."

Composition: a misty Mussoorie hill-station night. In the foreground, the rusted iron railing of Camel's Back Road snaking around a hill, with a sharp bend disappearing into ravine fog. Mid-ground: silhouettes of cedar trees and a single yellow sodium streetlamp casting a halo into the mist. Background: faint warm windows of colonial-era cottages on a far ridge. No people in frame. No body, no blood — implied dread, not depiction.

Style: painterly oil-painting brushwork, restrained palette of cool greys, deep teals, and amber lamplight. Family-friendly, atmospheric, noir. Cinematic composition, shallow depth of field, gentle film grain. Leave breathing room at top-left for a title treatment.

Aspect ratio: 3:2 landscape.
```

---

## 2. Suspect portraits

All six are **upper-body portraits, neutral backdrop, painterly oil**, ~4:5 aspect, family-friendly. Each prompt is self-contained.

### 2.1 Rhea Bhatia — `assets/portraits/rhea.png`

```
Painterly noir oil-painting portrait, 4:5 aspect ratio, upper body, soft studio lighting.

Subject: Rhea Bhatia, an Indian woman in her early 30s, polished and articulate, dressed like she just stepped out of a Delhi boardroom — sharp navy blazer over a cream blouse, minimal gold jewellery, hair pulled back. Posture composed but eyes guarded; the faint set of someone calculating which version of the truth to say next.

Background: out-of-focus muted teal-grey wash, suggestion of a hotel lobby behind her. Restrained palette of greys, deep teals, and a touch of amber lamplight. Soft brushwork, gentle film grain. No text, no logos. Family-friendly.
```

### 2.2 Inspector Devraj Khanna — `assets/portraits/devraj.png`

```
Painterly noir oil-painting portrait, 4:5 aspect ratio, upper body, low warm lamplight.

Subject: Inspector Devraj Khanna, an Indian man in his late 40s, tired-eyed, a Mussoorie-native police officer. Wearing a slightly creased khaki Uttarakhand police uniform with inspector's rank insignia, peaked cap held in one hand or set down beside him. Lined face, faint moustache, the weariness of a career built on burying one specific file. Posture deferential but the eyes are wary.

Background: out-of-focus dim small-town police station — wooden cupboard, a dusty case file just visible. Restrained palette of muted khaki, charcoal, and amber. Soft brushwork, gentle film grain. No text, no logos. Family-friendly — no weapons visible.
```

### 2.3 Naina Kapoor — `assets/portraits/naina.png`

```
Painterly noir oil-painting portrait, 4:5 aspect ratio, upper body, soft window light from one side.

Subject: Naina Kapoor, an Indian woman in her mid-30s, a Delhi-based graphic designer. Stylish but unraveling — dark layered top, silver studs, hair tucked behind one ear. Eyes faintly red-rimmed, as if from crying she'd never admit to. Sharp jawline, mouth set in something between sarcasm and grief. The look of someone caught between defensiveness and devastation.

Background: out-of-focus rain-streaked cafe window with a hill-town street beyond. Restrained palette of cool greys, deep blues, and a hint of warm lamplight. Soft brushwork, gentle film grain. No text. Family-friendly.
```

### 2.4 Mr. Rajveer Bisht — `assets/portraits/bisht.png`

```
Painterly noir oil-painting portrait, 4:5 aspect ratio, upper body, warm directional lamplight.

Subject: Mr. Rajveer Bisht, an Indian man in his mid-50s, immaculately tailored. Dark three-piece suit, silk pocket square, a heavy signet ring. Salt-and-pepper hair combed back, a charming half-smile that doesn't quite reach his eyes. The poised stillness of a man who has waited years for what he wants. Hand resting calmly on a polished wooden desk.

Background: out-of-focus private hotel office — wood panelling, a glint of brass on the wall behind him, no specific objects in focus. Restrained palette of deep mahogany, charcoal, amber lamplight. Soft brushwork, gentle film grain. No text, no logos. Family-friendly — nothing weapon-like in frame.
```

### 2.5 Anya Devi — `assets/portraits/anya.png`

```
Painterly noir oil-painting portrait, 4:5 aspect ratio, upper body, soft cool overcast light.

Subject: Anya Devi, a Garhwali woman in her early 50s, weathered hands clasped in front of her. A simple, well-worn salwar kameez in muted earth tones, with a soft grey woolen shawl draped over one shoulder. Hair pulled back, a faint bindi. Eyes downcast, but with an undertone of fierce quiet strength carrying fifteen years of guilt. Dignified, never caricatured.

Background: out-of-focus mist over cedar trees, suggestion of a hill-town path. Restrained palette of greys, soft mosses, and a single warm note from a far-off window. Soft brushwork, gentle film grain. No text. Respectful, family-friendly.
```

### 2.6 Prof. Kabir Iyer — `assets/portraits/kabir.png`

```
Painterly noir oil-painting portrait, 4:5 aspect ratio, upper body, soft library window light.

Subject: Prof. Kabir Iyer, an Indian man in his mid-30s, South Indian features, round wire-frame glasses, slightly rumpled corduroy jacket over a faded shirt. Anxious half-smile that doesn't reach the eyes. Hands fidgeting with a pen. The bearing of a mid-tier-university academic who is hiding something and knows it shows.

Background: out-of-focus university office — bookshelves, a stack of papers, a desk lamp casting warm light. Restrained palette of muted browns, deep teals, amber. Soft brushwork, gentle film grain. No text on books. Family-friendly.
```

---

## 3. Locations

All locations are **landscape scene paintings, no main subject characters**, ~3:2 aspect. Atmospheric backdrop plates.

### 3.1 Camel's Back Road — `assets/locations/camels-back-road.png`

```
Painterly noir oil-painting landscape, 3:2 aspect ratio.

Scene: Camel's Back Road, Mussoorie, at night. A narrow walking path snaking around a hillside, an old rusted iron railing on the ravine side. The sharp bend near Gun Hill point is in frame — railing weakest there, mist pooling in the drop. A single weak streetlamp barely illuminates one stretch of the road; the rest dissolves into thick cedar-forest mist. No people, no body — only implied unease.

Restrained palette of cool greys, deep teals, and amber lamplight haze. Soft painterly brushwork, gentle film grain, cinematic composition. Family-friendly. No text.
```

### 3.2 Thakur Cottage — `assets/locations/thakur-cottage.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: an abandoned colonial-era bungalow in Landour, Mussoorie. Stone walls streaked with moss, a slate roof, ivy creeping over a broken veranda. The front door slightly ajar onto a dark interior. Faded floral wallpaper just visible through a cracked window. A subtle detail on the wall inside — a rectangular unfaded patch where a long object once hung. Ransacked, frozen-in-time atmosphere from fifteen years ago.

Restrained palette of mossy greens, slate grey, sepia. Soft painterly brushwork, gentle film grain. Atmospheric, not gory. Family-friendly. No text.
```

### 3.3 Vikram's Cottage — `assets/locations/vikrams-cottage.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: a modest rented cottage in Mussoorie at twilight. Single-storey, pitched roof, two warm-lit windows. A laptop sits open on a wooden desk visible through one window, screen glow casting pale blue light against the interior. Garden in shadow. Faint mist in the cedars beyond.

Restrained palette of soft greys, warm window-amber, cool dusk blues. Painterly oil brushwork, gentle film grain, cinematic. Family-friendly. No text, no people in frame.
```

### 3.4 Royal Pines Hotel — `assets/locations/royal-pines.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: a grand luxury hill-station hotel in Mussoorie, evening. Imposing colonial-revival facade with warm chandeliered windows, a sweeping drive lined with cedar trees, a uniformed doorman silhouette under the porte-cochère. A polished brass nameplate "Royal Pines" just legible. The hotel feels confident and slightly oppressive — wealth built on something.

Restrained palette of deep amber, warm browns, and the cool blue of a hill-station dusk sky. Painterly brushwork, gentle film grain. Family-friendly. No text other than a small "Royal Pines" plaque.
```

### 3.5 Lovely Omelette Centre — `assets/locations/lovely-omelette.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: a cramped, beloved chai shop on Mall Road, Mussoorie, at dusk. A handpainted signboard reading "Lovely Omelette Centre". Two wooden tables and bench seats under a low tin awning, a steaming kettle on a kerosene stove, glass jars of biscuits, a single bare bulb glowing yellow. A teaspoon clinking against a glass tumbler is implied, not literal. No close-up of any one person; perhaps a vague figure of the owner behind the counter.

Restrained palette of warm amber, dusty pink, deep evening blue. Painterly brushwork, gentle film grain, cosy yet melancholy. Family-friendly. No other text besides the shop sign.
```

### 3.6 Mussoorie Police Station — `assets/locations/police-station.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: a small hill-town police station at night, painted khaki and white. A single bulb over the entrance, a metal sign reading "Mussoorie Police Station" in English and Devanagari. Inside, through a window, a wooden cupboard with stacked dusty case files, one labelled "THAKUR — 2011" half-buried at the back. A police jeep parked outside, slightly in shadow.

Restrained palette of muted khaki, charcoal, and warm interior amber. Soft painterly brushwork, gentle film grain. Family-friendly — no weapons visible. No people in frame.
```

### 3.7 Mussoorie Bus Stand — `assets/locations/bus-stand.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: a small Indian hill-town bus stand in the evening, a half-empty platform with peeling blue paint, a "9:15 PM — Dehradun" board faintly visible. A single fluorescent tube light flickering. A worn wooden bench. A torn bus ticket on the platform floor — small, almost incidental in the corner of the frame. Mist drifting in from beyond the platform's edge.

Restrained palette of fluorescent cool whites, faded blues, warm sodium-light spills. Painterly brushwork, gentle film grain. Quiet, slightly mournful. Family-friendly. No people in frame.
```

### 3.8 Cedar Grove Shortcut — `assets/locations/cedar-grove.png`

```
Painterly noir oil-painting, 3:2 aspect ratio.

Scene: a narrow earthen path winding through a dense grove of cedar trees in the Mussoorie hills at twilight. Tall straight trunks, hanging needles, thick carpet of cedar needles on the path. Mist threading between the trees. The path implies a shortcut known only to locals — half-hidden, easily missed.

Restrained palette of deep forest greens, charcoal, and a single shaft of failing amber light through a gap in the canopy. Painterly oil brushwork, gentle film grain, atmospheric. Family-friendly. No people, no animals, no text.
```

---

## 4. Key evidence pieces

These are the high-signal evidence cards that benefit most from a hand-crafted image. Smaller items (receipts, phone-record printouts, FIRs) read fine as plain documents and can be skipped on a first pass.

**Path convention:** save under `cases/mussoorie/assets/evidence/<evidence-id>.png` — you'll need to add this folder, and reference the path from each evidence item's `fullViewUrl` in `case.json` if you want them displayed in the UI later.

### 4.1 The Anonymous Letter (to the CBI) — `anonymous-letter-1.png`

```
Painterly noir still-life oil-painting, 4:3 aspect ratio.

Scene: a single sheet of cream-coloured paper, slightly crumpled and re-flattened, lying on a dark wooden desk under warm lamplight. The letter is in plain block-capital handwriting in dark blue ink — the words deliberately illegible, an impressionistic suggestion of writing rather than readable text. One corner of an opened brown envelope visible at the edge of frame, with a faded "Mussoorie" postmark. No address visible. Painterly oil brushwork, soft focus, gentle film grain.

Restrained palette of warm amber lamplight on cream paper against deep brown wood. Family-friendly. The mood is unsettled, intimate.
```

### 4.2 Building CCTV — 5:00 AM — `building-cctv-rhea.png`

```
Painterly noir still — image rendered as if it were a single still frame from a low-resolution building CCTV camera. 16:9 aspect ratio.

Scene: a dim apartment-building corridor at 5:00 AM, fisheye-distorted wide angle from a ceiling-corner camera. Timestamp burned into the top-right corner: "05:03  06-MAR". A woman in a long dark coat is just stepping out of a lift, her face turned partly away — recognisable in silhouette but not detailed. Composition deliberately mundane and unflattering, the way real CCTV is.

Painterly brushwork imitating the grainy washed-out look of CCTV, restrained palette of greenish-grey, cool fluorescent white, soft purple shadows. Family-friendly. No text other than the timestamp.
```

### 4.3 Vikram's Photograph — Empty Wall Mount, Thakur Cottage — `wall-mount-photo.png`

```
Painterly noir oil-painting in the style of a casual smartphone photograph, 4:3 aspect ratio.

Scene: an interior wall of an abandoned colonial-era cottage. Faded floral wallpaper covers most of it, except for a clean rectangular patch about 1 metre long where the wallpaper colour is brighter — the unfaded outline of a long object that once hung there. Two old screw-mount holes still in the wall. Slanting afternoon light falls across the patch through a window out of frame.

The image should feel like an investigative researcher took it on their phone — slightly off-square framing, soft natural light. Painterly oil brushwork rather than photoreal. Restrained palette of faded rose, dust, and amber. Family-friendly. No text. No weapon visible.
```

### 4.4 Vikram's Photograph — Rifle in Bisht's Office — `office-rifle-photo.png`

```
Painterly noir oil-painting in the style of a casual smartphone photograph taken from a doorway, 4:3 aspect ratio.

Scene: the wall of a private hotel office. A mounted antique British-era hunting rifle on dark wood panelling, framed by two oil portraits and a brass desk lamp. The composition is deliberately quick and slightly off-square — taken in haste through a half-open door. The rifle is mounted as a "collection piece"; it is decorative, hung horizontally, not being held or pointed.

Painterly oil brushwork, soft focus, gentle film grain. Restrained palette of mahogany, brass amber, charcoal. Family-friendly — the rifle is clearly historical decor, never pointed, no violence implied.
```

### 4.5 Anya's Grey Shawl — Freshly Washed — `grey-shawl-fresh.png`

```
Painterly noir still-life oil-painting, 4:3 aspect ratio.

Scene: a soft grey woolen shawl, freshly washed, hanging on a wooden clothesline strung between two cedar branches. Water droplets cling to the wool. The shawl is the local Garhwali kind, simple and well-worn. Morning mist drifts through the cedars in the background. A single wooden clip holds the shawl. The shawl is the entire subject; nothing else in frame.

Restrained palette of soft greys, mossy greens, pale dawn pink. Painterly oil brushwork, gentle film grain. Tender, melancholy. Family-friendly. No text.
```

### 4.6 Crime Scene Summary — `crime-scene-summary.png`

```
Painterly noir oil-painting, 4:3 aspect ratio.

Scene: the morning after — Camel's Back Road in pale grey-blue dawn light. A short stretch of rusted iron railing has been cordoned off with frayed yellow-and-black police tape. A weathered "CBI / Police" wooden barricade sign is propped against the railing. A faint single set of skid-like marks on the dirt path. No body, no chalk outline, no blood — only the aftermath: tape, mist, distance.

Restrained palette of cold blue-greys, weak amber from a far streetlamp, faint cedar greens. Painterly oil brushwork, gentle film grain. Atmospheric and respectful, family-friendly. No text other than the faded sign.
```

---

## 5. Optional smaller evidence (low priority)

These read fine as plain text or simple flat document mock-ups and don't need painterly treatment. Generate only if you want a full visual set.

| Evidence | Quick prompt seed |
|---|---|
| Chai-shop receipt | "Painterly close-up of a small paper receipt on a wooden tea-shop table, handwritten 'Lovely Omelette Centre — 6:30 PM — chai x2, omelette x1', warm amber lamplight, gentle brushwork." |
| Anya's bus ticket | "Painterly close-up of a torn paper Indian state-roadways bus ticket on a fluorescent-lit platform floor, '9:15 PM Mussoorie → Dehradun' just legible, soft brushwork, melancholy mood." |
| Vikram's Instagram story still | "Painterly oil rendering of a phone screen showing a single Instagram story — a misty cedar-grove path with a faint grey-clad figure at the edge of frame, caption 'Saw her again. Camel's Back Road. 9:40 PM.'" |
| Newspaper clipping — Doon Echo, 2011 | "Painterly still-life of a yellowed newspaper clipping pinned to a corkboard, headline impressionistic and not literally readable, masthead 'The Doon Echo — December 2011', soft library lamp light." |
| Land registry — shell companies | "Painterly oil rendering of a stack of official Indian land-registry documents on a wooden desk, partially fanned out, official stamps in faded red ink, names deliberately blurred. Restrained palette of sepia and amber lamplight." |

---

## 6. Iteration tips

- If the first generation feels too dark or too "horror", add: *"the mood is melancholy and atmospheric, never frightening. Soft, contemplative, family-friendly."*
- If faces look generic, add **one specific feature** from the persona (e.g., for Bisht: *"a heavy gold signet ring on his right hand"*; for Anya: *"a faint silver nose stud"*).
- If you want consistency across the suspect set, do all six in one ChatGPT thread back-to-back and reference earlier portraits ("same painterly style as Rhea's portrait, same restrained palette").
- For the cover, ask DALL·E to *leave a third of the canvas darker/lower-detail for title text*.
