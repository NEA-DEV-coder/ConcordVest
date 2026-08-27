# CONCORDVEST Design Direction

## Three stylistic approaches

### Theme Name: Quiet Structure
Very Brief Intro: A calm, editorial real-estate language built from ivory space, architectural lines, and measured navy typography. It makes the brand feel established, precise, and quietly premium.
Probability: 0.07

### Theme Name: Midnight Blueprint
Very Brief Intro: A darker architectural system with deep navy fields, blueprint-like rules, and restrained orange signals. It is more nocturnal and cinematic, with a stronger digital-product edge.
Probability: 0.04

### Theme Name: Gallery Residence
Very Brief Intro: A light, gallery-like catalogue with warm white surfaces, oversized photography, and orange used as a rare accent. It frames property and interiors as collectible editorial objects.
Probability: 0.09

## Selected approach: Quiet Structure

### Design Movement
Contemporary editorial architecture: a meeting point between architecture monographs, luxury property catalogues, and modern product interfaces.

### Core Principles
1. **Structure before decoration.** Use rules, columns, labels, and disciplined spacing to make every section feel considered.
2. **Photography carries the emotion.** Use large, cinematic imagery with text kept sparse and typographic.
3. **Contrast is intentional.** Let deep navy carry authority, warm white provide breathing room, and burnt orange mark only actions and moments of emphasis.
4. **Asymmetry creates character.** Prefer split compositions, offset cards, and editorial crops over repeated centered blocks.

### Color Philosophy
Deep navy `#012770` is the built environment: confident, dependable, and architectural. White `#FFFFFF` is the open plan: clear, calm, and generous. Orange `#ED7D01` is the human signal: a warm, precise cue for action, craft, and transformation. Supporting neutrals are warm stone and ink, used only to soften the navy/white system without introducing new brand colors.

### Layout Paradigm
Use a full-width cinematic hero, then shift into a left-aligned editorial rail with an orange index and large offset content blocks. Sections alternate between open white space and navy anchor panels. Feature grids should feel like a property catalogue: one dominant image, one supporting image, and deliberate breathing room.

### Signature Elements
- Orange architectural rule-lines and section indices such as `01 / 04`.
- A navy “address plate” treatment for location, category, and availability metadata.
- Oversized serif headlines paired with compact uppercase sans labels.

### Interaction Philosophy
Interactions feel like moving through a considered catalogue. Hover states sharpen images, lift the orange rule, and reveal a directional arrow; they do not bounce or glow. Menus are calm, keyboard-friendly, and visibly anchored to their triggers.

### Animation
Use short 180–260ms ease-out transitions. On page load, let hero typography and the discovery rail rise a few pixels with a stagger. Cards should only translate 4–6px and slightly brighten on hover. Navigation dropdowns fade and move from their trigger. Respect `prefers-reduced-motion` by disabling entrance and image-scale motion.

### Typography System
Display: **DM Serif Display** for architectural headlines, sentence case or restrained uppercase. Interface/body: **Manrope** for navigation, metadata, descriptions, and buttons. Use wide tracking for labels, tight tracking for display headlines, and a disciplined type scale from 11px labels to 72px desktop hero display.

### Brand Essence
Concordvest helps Abuja clients discover, acquire, build, renovate, and transform spaces through one thoughtful property and finishing partner. Personality: **precise, assured, discerning**.

### Brand Voice
Headlines sound like confident editorial statements, not sales slogans. CTAs are direct and useful. Microcopy is specific, warm, and free of filler.

Example lines:
- “The right address is only the beginning.”
- “Let’s draw the next room together.”

### Wordmark & Logo
Use the supplied geometric mark as a compact structural symbol beside a custom-spaced `CONCORDVEST` wordmark. The mark suggests two interlocking planes and a forward movement; keep it visible at a confident size in the header and footer.

### Signature Brand Color
**Concord Orange — `#ED7D01`**, used for primary actions, active rules, and the occasional warm material note against the deep navy and white foundation.

## Style Decisions
- Use only the provided brand colors plus warm stone and ink neutrals.
- Avoid gradients, excessive glass, generic pill-shaped cards, and invented proof points.
- Mark property listings as `Prototype listing` so demo content is transparent.
- Treat all unfinished routes as useful placeholder destinations with a visible “coming soon” state rather than dead clicks.
- Use Concord Orange as a precise signal for actions, indices, and small moments of emphasis; do not use it as a broad page background.
- Featured property layouts should use a dominant listing with supporting listings rather than defaulting to an equal marketplace grid.
- The geometric mark and custom-spaced wordmark must appear confidently in both header and footer.
