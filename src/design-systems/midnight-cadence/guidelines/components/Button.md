# Button

Triggers an action; one primary button per view, for the main next step.

- **primary**: the single most important action (Start free, Create issue). Fill `hy-btn-primary-bg`, text `hy-fg-inverse`.
- **secondary** (default): every other action. `hy-bg-raise` fill, `hy-line-strong` border.
- **ghost**: low-emphasis actions in dense areas (Log in, toolbar actions).
- `arrow` adds a trailing → that nudges 3px right on hover. Use it for actions that move the person forward.
- Sizes: `sm` 30px (toolbars), `md` 36px (default), `lg` 40px (forms, plan cards).
- For links use `LinkButton`, or `buttonClass()` on a router link.
- Labels are verbs in sentence case: "Start building", not "Get Started Now".
