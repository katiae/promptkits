# AppShell

The full-height app layout: sidebar, sticky top bar and scrolling content.

- Compose with `Sidebar`, `SidebarSection`, `SidebarItem` and `Topbar`.
- Sidebar items show an icon or a coloured `dot` (teams, projects) and an optional count in mono.
- Under 860px the sidebar becomes a drawer: pass `sidebarOpen` and `onSidebarClose`, and give `Topbar` an `onMenu` handler to show the menu button.
