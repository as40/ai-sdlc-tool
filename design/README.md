# Design Reference

ASCII wireframes for the AI SDLC Tool. Used as a shared reference during story implementation — not pixel-perfect specs, just structural layout to align decisions.

## Files

| File | Covers | Phases |
|------|--------|--------|
| [00-design-system.md](00-design-system.md) | UI library, colors, typography, spacing | All |
| [01-auth-onboarding.md](01-auth-onboarding.md) | Login, workspace setup, repo wizard, team invites | 2, 3 |
| [02-main-ide-layout.md](02-main-ide-layout.md) | Full IDE grid, file tree, editor, diff viewer, chat, HITL dialog, slash commands | 5, 6 |
| [03-jira-panel.md](03-jira-panel.md) | Jira connection settings, story browser, context attachment, design upload | 7 |
| [04-analytics-dashboard.md](04-analytics-dashboard.md) | Usage overview, AI breakdown, rate limits, audit log | 10 |
| [05-config-workspace.md](05-config-workspace.md) | Agent config, MCP skill registry, system prompt builder, env vars | 3.4, 13 |
| [06-canvas-workflow-builder.md](06-canvas-workflow-builder.md) | Visual agent workflow canvas, node configuration | 14 |

## UI Library Decision
**shadcn/ui** + Tailwind CSS. Components live in `packages/frontend/src/components/ui/` (copied, not imported).

## Key Layout Decisions
- Dark mode first. Base: zinc-950 background, zinc-900 panels.
- Three-column IDE layout: 240px left | flex center | 320px right
- Bottom panel (chat/terminal) collapsible: 280px expanded / 40px collapsed
- Header: 48px fixed
- `react-resizable-panels` for resizable IDE columns
- `lucide-react` for all icons
