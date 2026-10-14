<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Project rules

- Foldable uploaded-HTML previews simulate coarse-pointer CSS media conditions only in the preview document; saved HTML and downloads remain unchanged because iframe resizing cannot emulate touch hardware.

- Directory entries live in one `entries` table with `category` text and `tags` text[] (no join tables) — keeps admin editing and filtering simple.
- Public reads use the browser client with anon RLS (published only); writes are admin-only via `has_role` — no server functions needed yet.
- First admin is claimed via the `claim_admin()` RPC from /admin — auth-schema triggers are not allowed.
- `status` (published/draft/pending) and `submitted_by` exist so community submissions can be enabled later without schema changes.
- Design tokens live only in src/styles.css; components use semantic classes so the look can be restyled centrally.
- Template thumbnails are captured in the admin browser (html-to-image), using the preview's default-theme helper, and stored as compressed JPEG data URLs in `entries.thumbnail_url` — keeps captures consistent with demos; public storage buckets are blocked in this workspace.
- Template list loading is handled by EntryGrid with a shared EntrySkeleton and CSS crossfade — keeps card geometry and accessible loading states consistent across browsing views.
- Design system packages are served only through signed-in server functions; explicit admin ZIP imports override repo packages, which otherwise precede generated packages — respects the owner's chosen source without exposing package contents publicly.
- AI design systems: the model returns a strict JSON brief (spec.ts); code renders every file (render.ts) and stores them in `design_systems.files`; repo bundles in src/design-systems/ take precedence — keeps every generated package complete and consistent.
- Generated briefs include control geometry, separate brand/action/highlight colors and typed product compositions; the same tokens and patterns drive guidelines and React/Storybook exports — preserves template fidelity without executing model-authored code.
- Import css-tree only via its parser/walker/generator subpaths (the main entry loads lexer JSON at runtime and crashes the published server). Extract source illustrations, cards and CSS motion with HTML/CSS allowlists and scoped selectors; exclude scripts, handlers and remote resources — keeps original template visuals reusable without executing uploaded code.
- Serve generated packages from their saved brief using the current renderer, falling back to stored files only for legacy packages — layout fixes reach existing guidelines and downloads without another AI run.
- Scan ZIP imports on both client and authenticated admin server before saving; preserve original paths and binary encodings with reserved import metadata, and render deterministic file-based guidelines with script-free isolated HTML specimens — avoids executing uploaded code or replacing developer files.
- Imported design systems with a guidelines ZIP containing index.html serve that page verbatim as the web view, with an injected CSP (inline scripts, React CDN, Google Fonts only) inside a script-only sandbox — preserves the author's page exactly without network or same-origin access.
- AI design-system briefs include a spectrum-based identity (0-100 scales, a composable theme transition: kind + origin + softness + blur + timing) and the owner's generator skill (src/lib/ds-generator/skill.md) is embedded in the system prompt — Halyard/Sprig are anchors, not categories, so mid-spectrum templates get mid-spectrum treatments.
- The app's MCP server lives in src/lib/mcp/ (one tool per file, OAuth via the backend's auth server, tools query as the caller so RLS applies); /auth honours a validated ?next= so the consent page can resume after sign-in.
