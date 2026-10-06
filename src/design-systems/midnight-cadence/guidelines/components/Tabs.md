# Tabs

Navigation and filters with a sliding indicator behind the active item.

- `plain` for the site nav, sticky sub-navs and scroll-spy day lists; `track` for filters inside a bordered track.
- `orientation="vertical"` for side navigation within a page.
- Items with `href` render as links with `aria-current="page"`; others as toggle buttons.
- The indicator moves to the new item rather than appearing there. Pass `value={null}` to hide it (no page active).
