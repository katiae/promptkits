# Halyard Design System: guidelines and reference

Everything needed to use, host or rebuild the Halyard design system outside Claude. Drop this folder into any repo.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | The whole reference site in one self-contained file: brand guidelines, colour, type, space, logo, and live previews of every component with its usage notes. Open it directly or publish it anywhere. |
| `guidelines/brand.md` | The brand book: principles, colour, type, layout, motion, voice, iconography. Renders on GitHub as-is. |
| `guidelines/components/*.md` | When and how to use each component. |
| `tokens/tokens.json` | The tokens, in the format the `@halyard/ui` package uses. This is the source of truth. |
| `tokens/tokens.css` | The same tokens as CSS variables, dark and light themes. Link it in any project. |
| `tokens/tokens.design-system.json` | The same tokens in the Claude Design System page format, for re-importing. |
| `dist/halyard.js`, `dist/halyard.css` | A no-build version of the components: one script that sets `window.Halyard` (needs React 18 on the page) plus its stylesheet. |
| `dist/halyard.d.ts` | Component prop types, as documentation. |
| `previews/*.html` | One live, standalone preview per component. These are what `index.html` shows. |
| `assets/logos/` | The mark for dark and light backgrounds, with usage rules. |

## Viewing the reference site

Double-click `index.html`. It is one self-contained file: tokens, styles, components and logos are all inside it. Fonts (Geist, Geist Mono) and React load from public CDNs, so you need to be online.

The files in `previews/` load from `../dist/` and `../tokens/`, so serve the folder to open those on their own (`npx serve .`).

## Hosting it

- **GitHub Pages**: put this folder in a repo, then Settings → Pages → deploy from the branch and folder. Or publish just `index.html`; it needs nothing else.
- **Netlify, Vercel, S3** or any static host: upload the folder as it is.

## Using it in a new project

- **With a build step (React):** use the `@halyard/ui` package from the `halyard-ui` repo. It has the TypeScript source, Storybook and an `AGENTS.md` for AI coding tools.
- **Without a build step:** link `tokens/tokens.css` and `dist/halyard.css`, load React 18 and `dist/halyard.js`, then render `window.Halyard.Button` and the rest. Any file in `previews/` is a working example.
- **Just the look:** link `tokens/tokens.css`, use the `var(--hy-*)` variables, and follow `guidelines/brand.md`.

## Keeping it in sync

The `halyard-ui` repo is the source of truth. When tokens or components change there, refresh this folder:

1. Copy `src/tokens/tokens.json` and `src/tokens/tokens.css` into `tokens/`.
2. Run `npm run build:bundle` in `halyard-ui` and copy `dist-bundle/bundle.js` and `bundle.css` to `dist/halyard.js` and `dist/halyard.css`.
3. Update the matching file in `guidelines/` if the rules changed.
4. Regenerate `index.html` so the single-file site picks up the changes (ask Claude, or rebuild it from the files above).
