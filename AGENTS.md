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

- Directory entries live in one `entries` table with `category` text and `tags` text[] (no join tables) — keeps admin editing and filtering simple.
- Public reads use the browser client with anon RLS (published only); writes are admin-only via `has_role` — no server functions needed yet.
- First admin is claimed via the `claim_admin()` RPC from /admin — auth-schema triggers are not allowed.
- `status` (published/draft/pending) and `submitted_by` exist so community submissions can be enabled later without schema changes.
- Design tokens live only in src/styles.css; components use semantic classes so the look can be restyled centrally.
- Template thumbnails are captured in the admin browser (html-to-image) and stored as compressed JPEG data URLs in `entries.thumbnail_url` — public storage buckets are blocked in this workspace.
- Template list loading is handled by EntryGrid with a shared EntrySkeleton and CSS crossfade — keeps card geometry and accessible loading states consistent across browsing views.
- Design system packages live as files in src/design-systems/<template-slug>/ and are served only through signed-in server functions (guidelines HTML in a sandboxed iframe, ZIP built in the browser) — keeps paid-ready content out of public reads.
- AI design systems: the model returns a strict JSON brief (spec.ts); code renders every file (render.ts) and stores them in `design_systems.files`; repo bundles in src/design-systems/ take precedence — keeps every generated package complete and consistent.
- Serve generated packages from their saved brief using the current renderer, falling back to stored files only for legacy packages — layout fixes reach existing guidelines and downloads without another AI run.
