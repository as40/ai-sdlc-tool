# Auth & Onboarding Screens
> Covers Phase 2 (Auth) and Phase 3 (Workspace Onboarding)

---

## Screen 1 — Login Page (Story 2.0 / 2.1)

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                                                             │
│                    ◈  AI SDLC Tool                         │
│              Enterprise AI Development Platform             │
│                                                             │
│         ┌─────────────────────────────────────┐            │
│         │                                     │            │
│         │   Sign in to your workspace         │            │
│         │                                     │            │
│         │   ┌───────────────────────────┐     │            │
│         │   │ Work email                │     │            │
│         │   └───────────────────────────┘     │            │
│         │                                     │            │
│         │   ┌───────────────────────────┐     │            │
│         │   │ Password              [👁] │     │            │
│         │   └───────────────────────────┘     │            │
│         │                                     │            │
│         │   [      Sign in with SSO      ]    │            │
│         │                                     │            │
│         │   ─────────── or ───────────        │            │
│         │                                     │            │
│         │   [  Continue with local login  ]   │            │
│         │                                     │            │
│         │   [  Continue with GitHub SSO   ]   │            │
│         │   [  Continue with Google SSO   ]   │            │
│         │                                     │            │
│         └─────────────────────────────────────┘            │
│                                                             │
│              Need help? Contact your admin                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Screen 2 — Workspace Setup Wizard (Story 2.4)

### Step 1/4 — Name your workspace
```
┌─────────────────────────────────────────────────────────────┐
│  ◈ AI SDLC Tool                                    [logout] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Setup your workspace                                      │
│   ●────────────────────────────────○                        │
│   Step 1 of 4                                               │
│                                                             │
│   Workspace Name                                            │
│   ┌───────────────────────────────────────────────────┐    │
│   │ Acme Engineering                                  │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│   Workspace Slug (used in URLs)                             │
│   ┌───────────────────────────────────────────────────┐    │
│   │ acme-engineering                                  │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│   ┌───────────────────────────────────────────────────┐    │
│   │  ℹ  Invite additional team members after setup    │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│                              [  Cancel  ]  [ Continue → ]  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2/4 — AI Provider Configuration (Story 2.5)
```
┌─────────────────────────────────────────────────────────────┐
│  ◈ AI SDLC Tool                                    [logout] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Configure AI Provider                                     │
│   ────●──────────────────────────────○                      │
│   Step 2 of 4                                               │
│                                                             │
│   Provider                                                  │
│   ┌─────────────────────────────────┐                       │
│   │ Anthropic Claude            [▾] │                       │
│   └─────────────────────────────────┘                       │
│   (Options: Anthropic, OpenAI, Azure OpenAI, Bedrock)       │
│                                                             │
│   API Key                                            [?]   │
│   ┌───────────────────────────────────────────────────┐    │
│   │ sk-ant-••••••••••••••••••••••••••••••••       [👁] │    │
│   └───────────────────────────────────────────────────┘    │
│   ⚠ Stored encrypted with AES-256-GCM                      │
│                                                             │
│   Default Model                                             │
│   ┌─────────────────────────────────┐                       │
│   │ claude-sonnet-4-6           [▾] │                       │
│   └─────────────────────────────────┘                       │
│                                                             │
│   [ Test Connection ]     ✓ Connected                       │
│                                                             │
│                       [ ← Back ]  [ Continue → ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 3/4 — Connect Git Repositories (Story 3.1 / 3.2)
```
┌─────────────────────────────────────────────────────────────┐
│  ◈ AI SDLC Tool                                    [logout] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Connect Repositories                                      │
│   ──────────●────────────────────────○                      │
│   Step 3 of 4                                               │
│                                                             │
│   Git Provider                                              │
│   [ GitHub ] [ GitLab ] [ Bitbucket ] [ Self-Hosted ]      │
│   ──────────                                                │
│                                                             │
│   Personal Access Token                                     │
│   ┌───────────────────────────────────────────────────┐    │
│   │ ghp_••••••••••••••••••••••••••••••••          [👁] │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│   ┌───────────────────────────────────────────────────┐    │
│   │ 🔍 Search repositories...                         │    │
│   └───────────────────────────────────────────────────┘    │
│                                                             │
│   □ acme/frontend-app       React · Last push 2h ago        │
│   □ acme/backend-api        Node.js · Last push 4h ago      │
│   □ acme/shared-lib         TypeScript · Last push 1d ago   │
│   ■ acme/mobile-app         React Native · Last push 3d ago │
│   □ acme/infra              Terraform · Last push 1w ago    │
│                                                             │
│   3 selected                                                │
│                       [ ← Back ]  [ Continue → ]           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 4/4 — Tech Stack Scan (Story 3.3)
```
┌─────────────────────────────────────────────────────────────┐
│  ◈ AI SDLC Tool                                    [logout] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Scanning your codebase...                                 │
│   ─────────────────────●────────────○                       │
│   Step 4 of 4                                               │
│                                                             │
│   ████████████████████░░░░░░░░░  68%                        │
│                                                             │
│   ✓ acme/frontend-app   — React 18, TypeScript, Vite        │
│   ✓ acme/backend-api    — Node.js 20, Express, PostgreSQL   │
│   ⟳ acme/mobile-app    — Scanning... (React Native)         │
│                                                             │
│   Detected stack:                                           │
│   ┌─────────────────────────────────────────────┐          │
│   │  React 18     TypeScript    Node.js 20       │          │
│   │  PostgreSQL   Vite          Express           │          │
│   │  Tailwind     Jest          Docker            │          │
│   └─────────────────────────────────────────────┘          │
│                                                             │
│   This will be used to tailor AI prompts to your stack.    │
│                                                             │
│                                          [ Open Workspace ] │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Screen 3 — Invite Team Members (Story 2.4)
```
┌──────────────────────────────────────────────────┐
│  Invite team members                       [×]   │
├──────────────────────────────────────────────────┤
│                                                  │
│  Email address                                   │
│  ┌──────────────────────────────────────────┐   │
│  │ colleague@acme.com               [Role ▾] │   │
│  └──────────────────────────────────────────┘   │
│  [+ Add another]                                 │
│                                                  │
│  Roles:                                          │
│  ● Admin    — full access, manage team           │
│  ○ Engineer — use workspace, run AI tasks        │
│  ○ Viewer   — read-only audit access             │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ asoni764@gmail.com              Admin  ✓  │   │
│  │ dev@acme.com                    Engineer  │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│                  [Cancel]  [Send Invites]         │
│                                                  │
└──────────────────────────────────────────────────┘
```
