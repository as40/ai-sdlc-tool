# Design System & UI Decisions

## UI Library
**shadcn/ui** (Radix UI primitives + Tailwind CSS)

### Rationale
- Headless, accessible components — own the source in `src/components/ui/`
- Tailwind-native — no theming conflict
- Dark mode first — fits IDE aesthetic naturally
- Tree-shakeable by default — no unused bundle weight

## Color Palette (Dark Mode First)
```
Background:    #09090b  (zinc-950)   — app shell, panels
Surface:       #18181b  (zinc-900)   — cards, sidebars
Border:        #27272a  (zinc-800)   — dividers, input borders
Muted:         #3f3f46  (zinc-700)   — disabled, placeholders
Text primary:  #fafafa  (zinc-50)    — headings, active labels
Text muted:    #a1a1aa  (zinc-400)   — secondary labels, hints

Accent (brand): #6366f1 (indigo-500) — primary actions, focus rings
Success:        #22c55e (green-500)  — approved, passing
Warning:        #f59e0b (amber-500)  — pending, HITL needed
Error:          #ef4444 (red-500)    — failures, rejections
Info:           #3b82f6 (blue-500)   — AI activity, streaming
```

## Typography
```
Font family:  Inter (UI text),  JetBrains Mono (code, diffs, terminal)
Base size:    14px
Code size:    13px
Headings:     16px semi-bold (panel titles), 12px caps-tracked (section labels)
```

## Spacing Grid
```
4px base unit. Common values: 4, 8, 12, 16, 24, 32
Sidebar widths:  Left = 240px | Right = 320px
Panel min width: 480px (center editor)
Bottom bar height: 280px (collapsed 40px / expanded 280px)
Top header height: 48px
```

## shadcn/ui Components Planned
| Component         | Used In                             |
|-------------------|-------------------------------------|
| Button            | Actions everywhere                  |
| Input / Textarea  | Forms, chat input                   |
| Select / Combobox | Branch selector, mode picker        |
| Tabs              | Config dashboard, settings          |
| Dialog / Sheet    | Modals, side panels                 |
| Badge             | Story status, file mutation state   |
| ScrollArea        | File tree, diff viewer, chat        |
| Tooltip           | Icon buttons, truncated labels      |
| Avatar            | User identity, workspace members    |
| Separator         | Panel dividers                      |
| Skeleton          | Loading states (vectorization etc.) |
| Progress          | Embedding progress loader           |
| Toast (Sonner)    | Non-blocking notifications          |
| ResizablePanels   | IDE panel layout                    |
| CodeBlock (Monaco)| Center stage editor                 |

## Icon Library
`lucide-react` — consistent, tree-shakeable

## Responsive Strategy
- Desktop-first (this is a developer tool — min 1280px)
- No mobile layout required
- Resizable panels via `react-resizable-panels`
