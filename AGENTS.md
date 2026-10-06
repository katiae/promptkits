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
