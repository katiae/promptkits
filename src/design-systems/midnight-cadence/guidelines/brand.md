# Halyard

Halyard is a design system for dark, keyboard-first product UI: one set of tokens, components and motion that builds both the marketing site and the app. It is quiet by default, with graphite surfaces and a single warm accent, and it uses motion to explain what changed.

The code lives in the `@halyard/ui` package (React + TypeScript, with Storybook). This folder is the reference: tokens, live component previews and the rules for using them.

## Principles

- **One accent, used sparingly.** `hy-signal` (amber) marks the one thing that matters in a view: what is new, live, recommended or focused. Everything else is greyscale.
- **Motion explains change.** Indicators slide to the new choice, panels grow from where they open, a new row flashes once. Nothing moves only to decorate.
- **Complete at rest.** Every animation ends at the default state, so a screen is fully readable with reduced motion or before scripts load.
- **Keyboard first.** Every action is reachable by keyboard, common ones have single-key shortcuts, and everything lives in the ⌘K command menu.
- **Dense but calm.** Small type and tight rows in the app; generous space and big type on marketing pages. Both share the same tokens.

## Colour

- Surfaces step up in three levels: `hy-bg` (page), `hy-bg-raise` (windows, bars, panels), `hy-bg-card` (cards). Separate them with `hy-line` hairlines rather than shadows.
- Text has three levels: `hy-fg` for headings and primary text, `hy-fg-2` for body and secondary, `hy-fg-3` for IDs, captions and dates.
- `hy-signal` once per view. Status colours only mean status: `hy-ok` in review, `hy-info` done, `hy-danger` blocked. `hy-lavender` is an extra categorical colour for projects and charts.
- Dark is the primary theme. The light theme keeps the same roles; the accent darkens to `#b8711a` so it holds contrast on white.
- Text on a filled accent or the primary button uses `hy-fg-inverse`.

## Type

- **Geist** for everything; **Geist Mono** for IDs, numbers, versions, eyebrows and keys. Both are free on Google Fonts.
- Headings are Geist 600 in solid `hy-fg` with tight negative tracking (-0.045em at the largest size) and balanced wrapping. Never gradient, serif or italic.
- Display sizes are fluid: display-lg is `clamp(2.6rem, 7vw, 5.25rem)`, display-md `clamp(2rem, 4.4vw, 3.3rem)`, display-sm `clamp(1.6rem, 3vw, 2.25rem)`. The type specimens show their maximums.
- Body is 16px at 1.55 line height, about 62 characters wide. Ledes are 17–19px in `hy-fg-2`, about 48 characters wide.
- Eyebrows: Geist Mono 12px, uppercase, +0.08em tracking, in `hy-signal`, after an 18px rule.

## Space and layout

- 4px base. Lay out siblings with `gap`, never margins between them.
- Content column: 1120px max with a 16px gutter at every width. App sidebar: 220px; it becomes a drawer under 860px.
- Card grids use a 14px gap. Cards pad 26px. Sections pad 96px on desktop, 64px on mobile.
- Radii by role: `hy-radius-sm` tabs and menu items, `hy-radius-md` buttons and inputs, `hy-radius-lg` cards, `hy-radius-xl` windows and tables, `hy-radius-full` pills and tags.

## Motion

Two curves and four durations cover everything.

| Name | Value | Use |
| --- | --- | --- |
| ease-out | cubic-bezier(.16, 1, .3, 1) | Entrances, reveals, panels opening |
| ease-spring | cubic-bezier(.34, 1.56, .64, 1) | Things moving to a new place: indicators, thumbs, fanned cards |
| fast | 150ms | Hover colour, key presses |
| base | 250ms | Buttons, arrows, borders |
| slow | 450ms | Sliding indicators, drawers |
| slower | 1000ms | Page-load entrance |
| stagger | 90ms | Between items in a load sequence |

Presets (CSS classes, or the `Reveal` component):

- `.hy-rise`: on load, fades in from an 8px blur and 14px below. Stagger with `--hy-i`.
- `.hy-reveal`: on scroll, fades from 25% and rises 24px. Scroll-driven, no JavaScript.
- `.hy-tilt-in`: a product window flattening from an 18° tilt as it scrolls in.
- `.hy-grow-x`: progress and timeline bars growing from the left.
- `.hy-flash`: a single amber flash behind something that just appeared.

Rules: one orchestrated moment per screen (the hero entrance on marketing pages, the command menu in the app); move indicators instead of swapping them; wrap every animation in `prefers-reduced-motion: no-preference`.

## Signature interactions

- **Sliding indicator**: a soft pill behind the active nav link, tab or filter that springs to the new choice.
- **Cursor spotlight**: cards glow under the pointer and their border lights up in amber nearby.
- **Command menu**: ⌘K opens a frosted menu that scales in on the spring curve; typing filters; Enter runs.
- **Page transition**: the old page fades out with a slight blur, the new one fades up; the header stays put.

## Voice and copy

- Plain and specific. Short sentences, active voice, sentence case everywhere.
- Name things the way people recognise them: "notifications", not "webhook config".
- Buttons are verbs that say what happens: "Start building", "Create issue". Confirmations echo them: "Issue created".
- Errors say what went wrong and how to fix it, without apologising.
- Numbers are real and specific ("48 ms", "6 pts left"), set in Geist Mono.

## Iconography

- There is no icon font yet. The product uses simple Unicode glyphs (＋ ↻ ◎ ◇ ▤ →) at text size in `hy-fg-2`, and drawn status and priority icons (`StatusIcon`, `PriorityIcon`).
- When adding an icon set, use 1.5px strokes on a 16px grid with round caps, in `currentColor`, to match the mark.

## Logo

The mark is an A-frame with an amber crossbar. Files and clear-space rules are in `assets/logos/`. In code use `<Logo />` or `<LogoMark />`, which follow the theme.

## Using it in code

- Install the package and import `@halyard/ui/styles.css` once. Put `class="hy-body"` on `<body>`. Set `data-theme="light"` on `<html>` for the light theme.
- Reference tokens as CSS variables: `var(--hy-signal)`, `var(--hy-space-4)`, `var(--hy-radius-lg)`.
- Build screens from the components first. App screens start from `AppShell`; global actions go in `CommandMenu`.
- The repository includes Storybook, a GitHub Pages workflow for it, and an `AGENTS.md` that tells AI coding tools how to use the system.
