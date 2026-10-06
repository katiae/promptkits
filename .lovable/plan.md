# Prompt directory: live AI recreations + their build prompts

A curated directory (like Mobbin) where every entry is a well-known site or app rebuilt by AI. Visitors browse, try the live demo, and copy the exact prompt behind it.

## Pages
- **Home / Browse** (`/`): page intro, search, category chips, tag filter, sort, and a 3-column card grid (thumbnail, name, one-line description, tags, favourite heart, "View demo").
- **Entry detail** (`/sites/$slug`): header with name, tags, "Original" link, favourite. Split view: large framed live demo on the left (embedded URL in a browser-chrome frame, with "open full screen"), build prompt on the right with Copy button. Demo / Prompt tabs on smaller screens.
- **Category** (`/category/$slug`) and **Tag** (`/tag/$slug`): filtered grids.
- **Saved** (`/saved`): your favourites (sign-in required).
- **Sign in** (`/auth`): Google account only (one button).
- **Admin** (`/admin`, admin only): list, add, edit, delete entries (name, slug, description, original URL, demo URL, thumbnail upload, prompt, category, tags, published toggle).

## Visitor features (v1)
- Copy prompt (no login).
- Browse by category and tags, plus search.
- Save favourites (login).
- Community submissions later: data model includes a status field (draft / pending / published) and submitter so it can be switched on without rework.

## Design
Composition from the "Neon tech grid" direction (sticky slim header, mono meta line, filter bar between hairlines, 3-col cards with tags and status footer, split demo + prompt detail), re-skinned:
- Light mode, soft palette: warm off-white paper background, white cards, soft hairline borders, muted ink text, soft sage and dusty-rose accents (replacing cyan/magenta).
- Serif headings (Instrument Serif) with a clean sans body (Work Sans) and a mono for meta/prompts (IBM Plex Mono).
- Faint grid background kept but very low contrast.

## Starter content
6 seed entries (e.g. Cohere, Linear, Stripe, Arc, Notion, Raycast-style) with placeholder demo URLs and draft prompts, so the grid isn't empty. You'll replace demo URLs and prompts with your real ones via Admin.

## Technical details
- Lovable Cloud: tables `categories`, `tags`, `entries`, `entry_tags`, `favorites`, `user_roles` (+ `has_role`), storage bucket for thumbnails. RLS: public read of published entries; favourites scoped to owner; writes admin-only.
- Demo embed via sandboxed iframe; note some sites block iframing, so demo URLs should be your own deployed recreations (e.g. published Lovable projects).
- Per-route head() metadata; TanStack Query loaders for reads.
- You'll be made admin after first sign-up.
