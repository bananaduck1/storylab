# Design System — IvyStoryLab

## Product Context
- **What this is:** College admissions essay coaching platform combining a marketing site, student AI coach, live video sessions, and a teacher dashboard
- **Who it's for:** High school students and their families; college coaches and teachers
- **Space/industry:** EdTech / college admissions coaching
- **Project type:** Hybrid — marketing site + web app (student /lab + teacher /dashboard)

---

## Aesthetic Direction
- **Direction:** Literary / Organic
- **Decoration level:** Intentional — watercolor illustrations and texture washes as primary decoration
- **Mood:** The feeling of a handwritten letter on good paper. Warm, personal, trustworthy — not corporate, not SaaS-generic. The site should feel like it was made by someone who loves books and cares about students.
- **Key visual assets:** Watercolor illustrations (tree, coaching scene, crowd figures), film photo of founder, illustrated logo — all to be harmonized with the dark primary green

---

## Color

- **Approach:** Two-register — dark primary for chrome/authority, light surface for warmth/breathing room

| Token | Hex | Usage |
|---|---|---|
| `--green-primary` | `#2C4A3E` | Nav, hero backgrounds, primary buttons, footers, CTAs |
| `--green-hover` | `#3A6054` | Button hover states, active nav links |
| `--green-surface` | `#DEEEE9` | Section washes, /lab sidebar, card fills, light backgrounds |
| `--green-border` | `#C0D9CB` | Card borders, dividers, input borders |
| `--parchment` | `#E8D5B0` | Accent: consultation CTA section, user message bubbles, warm highlights |
| `--parchment-dark` | `#C9B48A` | Parchment hover/border |
| `--green-ink` | `#1A2E26` | Body text on light surfaces |
| `--white` | `#FAFAF8` | Main content backgrounds, chat area, breathing space between washes |

**Rule:** Dark primary anchors authority moments (nav, hero, CTAs). Light surface (`#DEEEE9`) provides warmth and breathing room. Parchment is the one warm contrast accent. Off-white separates green sections.

**Dark mode:** Invert — `#1A2E26` surfaces, `#DEEEE9` text, `#2C4A3E` borders. Reduce parchment saturation ~15%.

---

## Typography

| Role | Font | Rationale |
|---|---|---|
| Display / Hero | **Cooper** (self-hosted, `/public/Cooper/`) | The brand font. Round serifs, warmth, distinctiveness. Not found anywhere else in edtech. |
| Body / Reading | **Literata** (self-hosted, `/public/Literata/`) | Designed for long-form reading. Optical sizing. Works at both display and text scales. |
| UI / Chrome | **DM Sans** | Clean, neutral, geometric. Takes no attention away from content. Used for labels, nav links, buttons, metadata. |
| Data / Tables | **DM Sans** with `font-variant-numeric: tabular-nums` | Consistent column alignment |
| Code | **JetBrains Mono** (CDN) | Only used in technical/admin contexts |

**Loading:** Cooper and Literata loaded via `localFont` in `app/layout.tsx`. Both variables must be set on `<html>` for Tailwind CSS variable inheritance.

**Scale:**
| Level | Size | Font |
|---|---|---|
| Hero | `clamp(2.4rem, 5vw, 4rem)` | Cooper |
| H1 | `2rem` | Cooper or Literata |
| H2 | `1.6rem` | Literata |
| H3 | `1.15rem` | Literata |
| Body | `1rem` | Literata |
| Small / UI | `0.85rem` | DM Sans |
| Label / Eyebrow | `0.7rem`, `letter-spacing: 0.18em`, uppercase | DM Sans |

---

## Spacing

- **Base unit:** 4px
- **Density:** Comfortable — generous whitespace is part of the aesthetic
- **Scale:** `2(2px)` `4(4px)` `8(8px)` `16(16px)` `24(24px)` `32(32px)` `48(48px)` `64(64px)` `96(96px)`
- **Section padding:** `5rem` vertical on desktop, `3rem` on mobile

---

## Layout

- **Approach:** Hybrid — editorial for marketing (/academy), grid-disciplined for app (/lab, /dashboard)
- **Max content width:** `1100px` for marketing, `880px` for content-heavy sections
- **Grid:** 12-column; hero sections often 2-column (text + illustration)
- **Border radius:**
  - Cards: `4px`
  - Buttons: `3px`
  - Avatars / badges: `9999px`
  - Input fields: `4px`
- **Marketing page rhythm:** Dark section → Light wash → White → Parchment CTA → repeat

---

## Motion

- **Approach:** Minimal-functional — transitions aid comprehension, not performance
- **Easing:** `ease-out` (enter) · `ease-in` (exit) · `ease-in-out` (move)
- **Duration:**
  - Micro (hover, focus): `80ms`
  - Short (page transitions, modals): `200ms`
  - Medium (reveal animations): `350ms`

---

## Component Conventions

- **Primary button:** `bg-[#2C4A3E]` text white, hover `bg-[#3A6054]`, `3px` radius
- **Secondary / ghost button:** transparent bg, `1px border-[#C0D9CB]`, text `#2C4A3E`
- **Accent button (CTA):** `bg-[#E8D5B0]` text `#1A2E26` — used only on parchment sections
- **Active nav state:** border-left accent `#2C4A3E` on sidebar, underline on top nav
- **Section eyebrow:** `0.7rem` DM Sans, `letter-spacing: 0.18em`, uppercase, `#2C4A3E` at 55% opacity

---

## Asset Notes

- **Logo** (`/public/storylab-logo3.png`): Illustrated book + plant. Currently designed for light surfaces. To be regenerated for use on dark primary backgrounds (white/light version needed for nav on dark hero).
- **Watercolor illustrations** (`photo-1.png` through `photo-4.png`, `tree.png`): Currently on light green washes. To be regenerated to harmonize with `#2C4A3E` backgrounds where needed.
- **`watercolor-wash.svg`**: Existing SVG texture. Use as `background-image` on `--green-surface` sections.
- **Film photo** (`sam-photo.JPG`): Works as-is on both light and dark surfaces.
- **Event photo** (`StoryLab Sam talking.png`): Works as-is.

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-03-18 | Initial design system created | Created by /design-consultation |
| 2026-03-18 | Chose Literary/Organic aesthetic | Platform is about personal storytelling; edtech is a sea of clean-SaaS; literary warmth differentiates |
| 2026-03-18 | Cooper as display font | Self-hosted, already in use, deeply distinctive for the category |
| 2026-03-18 | Added Literata as body font | Found self-hosted in /public/Literata/; designed for reading; better than DM Sans for long-form coaching content |
| 2026-03-18 | Two-register color system | Dark `#2C4A3E` primary for authority/chrome; light `#DEEEE9` surface for warmth. Avoids feeling like either a stuffy institution or a generic SaaS tool |
| 2026-03-18 | Parchment `#E8D5B0` as accent | Unexpected in edtech; thematically resonant (color of the page being written on); creates warm contrast against both greens |
| 2026-03-18 | Assets flagged for regeneration | Existing watercolor illustrations and logo designed for light surfaces; need dark-background variants for primary sections |
