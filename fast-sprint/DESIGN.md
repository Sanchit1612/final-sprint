# Fast Sprint Design System

Feel: very clean, minimal, premium dark. Lots of whitespace, big bold headings.

## Font
Outfit (Google Fonts) — bold geometric sans, matches the logo. Headings 700, body 400/500.
Logo: wordmark "Fast Sprint" in white, bold, on near-black.

## Colors
--bg: #0A0A0B
--surface: #121214
--surface-2: #1A1A1D
--border: #26262A
--text: #FFFFFF
--muted: #A1A1AA
--accent: #5689FF (electric blue: buttons, active states, charts, AND selected words in headings, key numbers and small labels)
--accent-soft: rgba(86,137,255,0.12)
--success: #22C55E (only for completed ticks)

## Rules
- Black background, white text, blue only as accent. No gradients except subtle blue glow on primary CTA.
- Cards: surface color, 1px border, radius 16px, generous padding.
- Buttons: primary = blue filled; secondary = outline white/10.
- Charts: blue line/bars on dark, muted grid lines. Use Recharts.
- Pricing bundle cards are the ONE place allowed to be colourful (soft coloured accents per card) to carry the pizza/coffee marketing.
- Mobile-first; most users are on phones.
- Smooth but minimal animation (150-200ms).

## Typography and identity (V2)
- White for primary text; blue (#5689FF) for selected words only, e.g. "Your <blue>next move</blue> starts here." Use for hero and section headings, key numbers and small labels (`.eyebrow`). Never colour a whole paragraph.
- Display headings: weight 700, tracking -0.035em, line-height ~1.02 (`.display`).
- Depth: charcoal surfaces with a faint top highlight, 1px borders, restrained shadow (`.card`), blue glow only behind the hero and the featured price.
- Hover: cards lift 2px and gain a blue border (`.hover-card`); buttons brighten and press (scale 0.98).
