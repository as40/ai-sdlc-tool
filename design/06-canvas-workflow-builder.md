# Canvas Workflow Builder
> Phase 14 (Story 14.1) — Visual Compilation Engine

The canvas lets workspace admins visually compose multi-agent workflows by dragging and connecting agent nodes.

---

## Full Canvas Layout

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◈ AI SDLC Tool  |  Workflow Builder: "Story Implementation"   [Save] [Run ▶] │
├───────────────────────────────────────────────────────────────────────────────┤
│ TOOLBAR                                                                       │
│ [+ Agent] [+ Condition] [+ HITL Gate] [+ Loop] [+ End]  |  [Undo] [Redo]     │
│ [Select ▾]  Zoom: [─────●──] 100%                        |  [Validate] [Export]│
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  CANVAS                                                                       │
│  ─────────────────────────────────────────────────────────────────────────── │
│                                                                               │
│        ┌─────────────────┐                                                    │
│        │  ▶ START        │                                                    │
│        │  Trigger:       │                                                    │
│        │  /implement cmd │                                                    │
│        └────────┬────────┘                                                    │
│                 │                                                              │
│                 ▼                                                              │
│        ┌─────────────────┐                                                    │
│        │  🤖 Planner     │                                                    │
│        │  Agent          │  ← click to configure                              │
│        │  Decomposes     │                                                    │
│        │  story to tasks │                                                    │
│        └────────┬────────┘                                                    │
│                 │                                                              │
│          ┌──────▼──────┐                                                      │
│          │  ◆ Condition │                                                      │
│          │  tasks > 0? │                                                      │
│          └──┬───────┬──┘                                                      │
│          Yes│       │No                                                        │
│             ▼       ▼                                                          │
│    ┌──────────┐  ┌────────┐                                                   │
│    │🤖 Coder  │  │ ■ END  │                                                   │
│    │Implements│  │No tasks│                                                   │
│    │each task │  │found   │                                                   │
│    └────┬─────┘  └────────┘                                                   │
│         │                                                                      │
│         ▼                                                                      │
│    ┌─────────────────┐                                                        │
│    │  ⚠ HITL Gate   │                                                        │
│    │  Review file   │                                                        │
│    │  changes       │                                                        │
│    └────┬───────┬───┘                                                        │
│    Approv│       │Reject                                                      │
│         ▼       ▼                                                              │
│   ┌──────────┐ ┌──────────┐                                                   │
│   │🤖 Tester │ │↺ Return  │                                                   │
│   │Generates │ │to Coder  │                                                   │
│   │tests     │ └──────────┘                                                   │
│   └────┬─────┘                                                                │
│        │                                                                       │
│        ▼                                                                       │
│   ┌─────────────┐                                                             │
│   │ ■ END       │                                                             │
│   │ Notify user │                                                             │
│   └─────────────┘                                                             │
│                                                                               │
├───────────────────────────────────────────────────────────────────────────────┤
│ STATUS BAR                                                                    │
│ Nodes: 8  ·  Valid: ✓  ·  Last saved: 2 min ago  ·  [View JSON]              │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Node Configuration Panel (opens on click)

```
┌────────────────────────────────────────────────┐
│  Configure Node: Coder Agent              [×]  │
├────────────────────────────────────────────────┤
│                                                │
│  Node Type: Agent                              │
│                                                │
│  Agent                                         │
│  ┌──────────────────────────────────────────┐ │
│  │ CodeImplementor                      [▾] │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Node Label                                    │
│  ┌──────────────────────────────────────────┐ │
│  │ Coder                                    │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Input Context                                 │
│  ☑ Story description                          │
│  ☑ File tree snapshot                         │
│  ☐ Previous node output (raw)                 │
│  ☑ Previous node output (summary)             │
│                                                │
│  Max Iterations                                │
│  ┌──────────────────────────────────────────┐ │
│  │ 5                                        │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  On failure:  ○ Stop   ● Retry (max 2)        │
│                                                │
│                      [Cancel]  [Save Node]     │
│                                                │
└────────────────────────────────────────────────┘
```

---

## HITL Gate Node

```
┌────────────────────────────────────────────────┐
│  Configure Node: HITL Gate                [×]  │
├────────────────────────────────────────────────┤
│                                                │
│  Node Type: Human-in-the-Loop Gate             │
│                                                │
│  Trigger When                                  │
│  ● Always (pause here)                        │
│  ○ On condition:                               │
│    ┌──────────────────────────────────────┐   │
│    │ output.filesChanged > 3              │   │
│    └──────────────────────────────────────┘   │
│                                                │
│  Presented To                                  │
│  ┌──────────────────────────────────────────┐ │
│  │ Assigned user (session owner)        [▾] │ │
│  └──────────────────────────────────────────┘ │
│                                                │
│  Timeout                                       │
│  ┌──────────────────────────────────────────┐ │
│  │ 30 minutes                               │ │
│  └──────────────────────────────────────────┘ │
│  On timeout:  ● Auto-approve   ○ Auto-reject  │
│                                                │
│  Outgoing edges: [Approved]  [Rejected]        │
│                                                │
│                      [Cancel]  [Save Node]     │
│                                                │
└────────────────────────────────────────────────┘
```
