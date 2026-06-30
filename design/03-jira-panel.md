# Jira Integration Screens
> Phase 7 (Stories 7.1–7.4) — Jira Integration & Context Binding

---

## Screen 1 — Jira Connection Settings (Story 7.1)
> Accessed from Settings → Integrations

```
┌─────────────────────────────────────────────────────────────────┐
│  Settings                                              [×]      │
├──────────────────┬──────────────────────────────────────────────┤
│  General         │                                              │
│  AI Providers    │  Jira Connection                            │
│  Integrations  ← │  ──────────────────────────────────────      │
│  Team            │                                              │
│  Security        │  Jira URL                                    │
│  Billing         │  ┌──────────────────────────────────────┐   │
│                  │  │ https://acme.atlassian.net           │   │
│                  │  └──────────────────────────────────────┘   │
│                  │                                              │
│                  │  API Token                         [?]       │
│                  │  ┌──────────────────────────────────────┐   │
│                  │  │ ••••••••••••••••••••••••••••    [👁] │   │
│                  │  └──────────────────────────────────────┘   │
│                  │  ⚠ Stored encrypted — never logged          │
│                  │                                              │
│                  │  Email (used for API auth)                   │
│                  │  ┌──────────────────────────────────────┐   │
│                  │  │ asoni764@gmail.com                   │   │
│                  │  └──────────────────────────────────────┘   │
│                  │                                              │
│                  │  [ Test Connection ]   ✓ Connected           │
│                  │                                              │
│                  │  Default Project                             │
│                  │  ┌──────────────────────────────────────┐   │
│                  │  │ BACKEND — Backend Platform        [▾] │   │
│                  │  └──────────────────────────────────────┘   │
│                  │                                              │
│                  │                            [ Save Changes ]  │
│                  │                                              │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## Screen 2 — Epic-to-Story Browser (Story 7.2)
> Left panel Jira tab, expanded view

```
┌──────────────────────────────────────────────────────┐
│  JIRA                                    [⟳] [+New]  │
│  ────────────────────────────────────────────────    │
│  Project: BACKEND ▾                                  │
│                                                      │
│  🔍 Search stories...                                │
│  ────────────────────────────────────────────────    │
│                                                      │
│  ▾ 🟣 AUTH — Auth & Identity System                  │
│    │                                                 │
│    ├─ ● AUTH-12   SSO Login Integration              │
│    │    IN PROGRESS · Story Points: 5                │
│    │    [Currently Active ★]                         │
│    │                                                 │
│    ├─ ○ AUTH-13   JIT Auto-Provisioning              │
│    │    TODO · Story Points: 3                       │
│    │    [Attach to session]                          │
│    │                                                 │
│    ├─ ○ AUTH-14   RBAC Middleware                    │
│    │    TODO · Story Points: 8                       │
│    │    [Attach to session]                          │
│    │                                                 │
│    └─ ✓ AUTH-11   Auth DB Schema                    │
│         DONE · Merged 2d ago                        │
│                                                      │
│  ▶ 🔵 GIT — Git Operations                          │
│  ▶ 🟡 SANDBOX — Docker Sandbox                      │
│  ▶ 🟢 ANALYTICS — Usage Metrics                     │
│                                                      │
│  ────────────────────────────────────────────────    │
│  ACTIVE CONTEXT                                      │
│  ● Story: AUTH-12 SSO Login                         │
│  ● Branch: feature/auth-sso                         │
│  [Clear context]                                    │
└──────────────────────────────────────────────────────┘
```

---

## Screen 3 — Context Attachment Panel (Story 7.3)

```
┌────────────────────────────────────────────────────────────┐
│  Attach Context to Session                           [×]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Story: AUTH-12 — SSO Login Integration                    │
│  ──────────────────────────────────────────────────────    │
│                                                            │
│  Story Description                               [▾ hide]  │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Implement OAuth2/OIDC SSO login via passport.js.     │ │
│  │ Support Google, GitHub, and custom SAML providers.   │ │
│  │ JIT-provision users on first login...                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Acceptance Criteria                                       │
│  ☑ OAuth2/OIDC flow via passport.js                       │
│  ☑ Google provider working                                │
│  ☑ GitHub provider working                                │
│  ☐ SAML provider (enterprise)                             │
│  ☐ JIT user provisioning on first login                   │
│                                                            │
│  Attached Files                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ 📎 login-flow-design.png        [View] [Remove]       │ │
│  │ 📎 auth-technical-spec.md       [View] [Remove]       │ │
│  │ 📎 saml-provider-config.yml     [View] [Remove]       │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [+ Upload File]   [+ Attach from Jira]                    │
│                                                            │
│  Included in AI Context: 3 files, ~8,200 tokens           │
│                                                            │
│                      [Cancel]  [Activate Context]          │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Screen 4 — Design Ingestion / Multimodal Upload (Story 7.4)

```
┌────────────────────────────────────────────────────────────┐
│  Ingest Design File                                  [×]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                                                      │ │
│  │   ┌─────────┐                                        │ │
│  │   │  IMAGE  │   login-flow-design.png                │ │
│  │   │ PREVIEW │   2.4 MB · 1440×900                    │ │
│  │   └─────────┘                                        │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  AI Extraction Preview                                     │
│  ──────────────────────────────────────────────────────    │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ ✓ Detected screens: Login page, OAuth callback       │ │
│  │ ✓ Components: Email input, Password input, SSO btn   │ │
│  │ ✓ Flow: Login → OAuth redirect → JIT provision       │ │
│  │ ℹ Extracted 847 tokens of UI context                 │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Label (optional)                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ SSO Login Flow Design                                │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│                    [Cancel]  [Add to Session Context]      │
│                                                            │
└────────────────────────────────────────────────────────────┘
```
