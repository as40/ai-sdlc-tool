# Analytics Dashboard
> Phase 10 (Stories 10.3 / 10.4) — Workspace Admin Analytics & Rate Limits

---

## Main Analytics Dashboard (Story 10.3)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◈ AI SDLC Tool  |  Admin Dashboard — Analytics            [Settings] [Logout] │
├────────────────────┬──────────────────────────────────────────────────────────┤
│  Overview       ←  │                                                          │
│  AI Usage          │  Usage Overview                  [Last 7 days ▾] [⟳]   │
│  Cost Breakdown    │  ─────────────────────────────────────────────────────   │
│  Rate Limits       │                                                          │
│  Audit Log         │  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  Team Members      │  │ Total Calls│ │ Total Tokens│ │ Est. Cost  │           │
│                    │  │            │ │             │ │            │           │
│                    │  │   1,247    │ │  2.4M tok   │ │   $18.32   │           │
│                    │  │ ↑12% wk    │ │  ↑8% wk     │ │  ↑9% wk   │           │
│                    │  └────────────┘ └────────────┘ └────────────┘           │
│                    │                                                          │
│                    │  Daily AI Call Volume                                    │
│                    │  ───────────────────────────────────────────────────     │
│                    │  300 │           ▄▄                                      │
│                    │  200 │       ▄▄ ████ ▄▄                                  │
│                    │  100 │  ▄▄  ████████████▄▄                               │
│                    │    0 └──────────────────────────────                     │
│                    │       Mon  Tue  Wed  Thu  Fri  Sat  Sun                  │
│                    │                                                          │
│                    │  Usage by Team Member                                    │
│                    │  ───────────────────────────────────────────────────     │
│                    │  User                Calls   Tokens    Cost              │
│                    │  ─────────────────────────────────────────────           │
│                    │  asoni764@gmail.com   421    890K    $6.80               │
│                    │  dev@acme.com         318    672K    $5.12               │
│                    │  qa@acme.com          189    412K    $3.14               │
│                    │  design@acme.com       84    201K    $1.53               │
│                    │                                                          │
│                    │  [Export CSV]                                            │
│                    │                                                          │
└────────────────────┴──────────────────────────────────────────────────────────┘
```

---

## AI Usage Breakdown (Story 10.2 / 10.3)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  AI Usage Details                                [Last 30 days ▾] [⟳]        │
│  ─────────────────────────────────────────────────────────────────────────    │
│                                                                               │
│  By Model                        By Provider                                 │
│  ──────────────────────          ─────────────────────                       │
│  claude-sonnet-4-6  ████░  68%   Anthropic     ████░  75%                    │
│  claude-haiku-4-5   ██░░░  22%   OpenAI        ██░░░  20%                    │
│  gpt-4o             █░░░░  10%   Azure OpenAI  █░░░░   5%                    │
│                                                                               │
│  By Task Type                                                                 │
│  ──────────────────────────────────────────────────────────────────────────   │
│  Task Type           Calls    Avg Tokens   Total Tokens   Est. Cost           │
│  ────────────────────────────────────────────────────────────────────         │
│  Code Generation      534      3,200        1.7M          $13.12             │
│  Code Review          312      1,800        561K           $4.28             │
│  Test Generation      189      2,100        396K           $3.02             │
│  Explanation          142        900        127K           $0.97             │
│  Context Summarize     70      1,400         98K           $0.75             │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Rate Limits Configuration (Story 10.4)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Rate Limit Configuration                                                     │
│  ─────────────────────────────────────────────────────────────────────────    │
│                                                                               │
│  These limits apply per workspace. Individual user overrides are below.       │
│                                                                               │
│  Global Limits                                                                │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│  Max AI calls per hour (workspace)                                            │
│  ┌────────────────────────────┐  Current: 142/200 this hour                  │
│  │ 200                        │                                               │
│  └────────────────────────────┘                                               │
│                                                                               │
│  Max tokens per day (workspace)                                               │
│  ┌────────────────────────────┐  Current: 2.1M / 5M today                    │
│  │ 5,000,000                  │                                               │
│  └────────────────────────────┘                                               │
│                                                                               │
│  Max cost per month (USD)                                                     │
│  ┌────────────────────────────┐  Current: $18.32 / $100 this month           │
│  │ 100                        │  ████░░░░░░░░░░░░░  18%                      │
│  └────────────────────────────┘                                               │
│                                                                               │
│  Action when limit hit:                                                       │
│  ● Block requests   ○ Queue requests   ○ Notify only                         │
│                                                                               │
│  Per-User Overrides                                                           │
│  ───────────────────────────────────────────────────────────────────────────  │
│  User                   Calls/hr    Tokens/day    Cost/mo                     │
│  ─────────────────────────────────────────────────────────                   │
│  asoni764@gmail.com     Unlimited   Unlimited     Unlimited   [Edit]          │
│  dev@acme.com           100         2M            $50         [Edit]          │
│  qa@acme.com            50          1M            $25         [Edit]          │
│                                                                               │
│  [+ Add User Override]                                                        │
│                                                                               │
│                                                        [ Save Rate Limits ]   │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Audit Log (Story 10.1 / 10.2)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  Execution Audit Log                                                          │
│  ─────────────────────────────────────────────────────────────────────────    │
│                                                                               │
│  🔍 Search...    [User ▾]  [Task Type ▾]  [Model ▾]  [Date Range ▾]          │
│                                                                               │
│  Timestamp           User           Task Type      Model              Tokens  │
│  ──────────────────────────────────────────────────────────────────────────   │
│  2026-06-30 14:02    asoni764       CODE_GEN       claude-sonnet-4-6   4,821  │
│  2026-06-30 13:47    dev@acme.com   CODE_REVIEW    claude-haiku-4-5    1,203  │
│  2026-06-30 13:31    asoni764       TEST_GEN       claude-sonnet-4-6   3,140  │
│  2026-06-30 13:12    qa@acme.com    EXPLANATION    claude-sonnet-4-6     892  │
│  2026-06-30 12:58    dev@acme.com   CODE_GEN       gpt-4o              5,102  │
│                                                                               │
│  [View Details]  on each row → expands to show full prompt/response           │
│                                                                               │
│  ← Page 1 of 47 →                              [Export CSV]  [Export JSONL]  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```
