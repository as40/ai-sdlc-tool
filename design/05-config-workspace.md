# Configuration Workspace
> Phase 13 (Stories 13.1–13.6) — Advanced Workspace Customization & Validation

---

## Tabbed Config Dashboard (Story 13.1)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│ ◈ AI SDLC Tool  |  Configuration                          [Settings] [Logout] │
├───────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  [AI Agents]  [MCP Skills]  [System Prompt]  [Rules]  [Standards]  [Env Vars] │
│   ──────────                                                                  │
│                                                                               │
│  AI Agents Configuration                                                      │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│  [+ New Agent]                                          [Import JSON]         │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ● CodeImplementor                                       [Edit] [Delete] │ │
│  │  Role: Writes code from story acceptance criteria                        │ │
│  │  Model: claude-sonnet-4-6  ·  Max tokens: 8,192  ·  Temperature: 0.2   │ │
│  │  Skills: file_read, file_write, run_tests                               │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ● CodeReviewer                                          [Edit] [Delete] │ │
│  │  Role: Reviews diffs for correctness, security, style                   │ │
│  │  Model: claude-sonnet-4-6  ·  Max tokens: 4,096  ·  Temperature: 0.1   │ │
│  │  Skills: file_read, git_diff                                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ● TestGenerator                                         [Edit] [Delete] │ │
│  │  Role: Writes unit and integration tests for new code                   │ │
│  │  Model: claude-haiku-4-5  ·  Max tokens: 4,096  ·  Temperature: 0.3    │ │
│  │  Skills: file_read, file_write                                          │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Edit Form (Story 13.2)

```
┌────────────────────────────────────────────────────────────┐
│  Edit Agent: CodeImplementor                         [×]   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  Agent Name                                                │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ CodeImplementor                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Role Description                                          │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Writes production-quality code from story acceptance │ │
│  │ criteria, following project coding standards.        │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  Model                          Temperature                │
│  ┌──────────────────────┐      ┌────────────────────┐     │
│  │ claude-sonnet-4-6 [▾]│      │ 0.2                │     │
│  └──────────────────────┘      └────────────────────┘     │
│                                                            │
│  Max Output Tokens                                         │
│  ┌──────────────────────┐                                  │
│  │ 8192                 │                                  │
│  └──────────────────────┘                                  │
│                                                            │
│  Available MCP Skills                                      │
│  ☑ file_read          ☑ file_write         ☐ git_commit   │
│  ☑ run_tests          ☐ search_web         ☐ run_terminal │
│  ☐ git_diff           ☐ jira_read          ☐ jira_write   │
│                                                            │
│  HITL Required For:                                        │
│  ☐ All actions    ☑ File writes    ☑ Test execution       │
│                                                            │
│  ⚠ Validation errors will appear here                     │
│                                                            │
│                        [Cancel]  [Save Agent]              │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## MCP Skills Tab (Story 13.3)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  [AI Agents]  [MCP Skills]  [System Prompt]  [Rules]  [Standards]  [Env Vars] │
│               ────────────                                                    │
│                                                                               │
│  MCP Skill Registry                                                           │
│  [+ Register Skill]                                  [Import Schema]          │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ⚙ file_read                                             [Edit] [Delete]│ │
│  │  Reads file content from the sandbox filesystem                         │ │
│  │  Input:  { path: string }                                               │ │
│  │  Output: { content: string, lines: number }                             │ │
│  │  Transport: stdio  ·  Timeout: 5s                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │  ⚙ file_write                                            [Edit] [Delete]│ │
│  │  Writes or patches a file in the sandbox                                │ │
│  │  Input:  { path: string, content: string, mode: 'write'|'patch' }      │ │
│  │  Output: { success: boolean, linesChanged: number }                     │ │
│  │  Transport: stdio  ·  Timeout: 10s  ·  HITL: required                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Register Custom Skill (JSON Schema)                                          │
│  ───────────────────────────────────────────────────────────────────────────  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ {                                                                       │ │
│  │   "name": "my_custom_skill",                                            │ │
│  │   "description": "...",                                                 │ │
│  │   "inputSchema": { ... },                                               │ │
│  │   "transport": "http",                                                  │ │
│  │   "endpoint": "http://localhost:8080/mcp"                               │ │
│  │ }                                                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│  [ Validate Schema ]   ✓ Valid MCP schema                                     │
│                                                [Save Skill]                   │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## System Prompt Compiler Tab (Story 13.6 / 5.2)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  [AI Agents]  [MCP Skills]  [System Prompt]  [Rules]  [Standards]  [Env Vars] │
│                             ───────────────                                   │
│                                                                               │
│  System Prompt Builder                                                        │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│  Locked Base Sections (read-only — set by admin)                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 🔒 Security Rules          [View]                                       │ │
│  │ 🔒 IP Protection Policy    [View]                                       │ │
│  │ 🔒 Output Format Rules     [View]                                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Workspace Sections (editable)                                                │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ 📝 Project Context & Stack                               [Edit] [×]     │ │
│  │ 📝 Coding Standards                                      [Edit] [×]     │ │
│  │ 📝 Architecture Rules                                    [Edit] [×]     │ │
│  │ [+ Add Section]                                                         │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  Compiled Preview (read-only)                  Estimated tokens: ~3,200       │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ You are an expert software engineer working in the Acme Engineering      │ │
│  │ workspace. The tech stack is: Node.js 20, Express 5, TypeScript...      │ │
│  │ [SECURITY]: Never expose secrets. Never log plaintext credentials.      │ │
│  │ [CODING STANDARDS]: Always use strict TypeScript. No `any` types...     │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│                                           [Copy]  [ Save & Recompile ]        │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables Tab (Story 3.4)

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  [AI Agents]  [MCP Skills]  [System Prompt]  [Rules]  [Standards]  [Env Vars] │
│                                                                    ─────────  │
│                                                                               │
│  Environment Variable Gateway                                                 │
│  ⚠ All values encrypted at rest. Never logged or exposed to client.          │
│  ───────────────────────────────────────────────────────────────────────────  │
│                                                                               │
│  Scope: [Workspace ▾]  (Workspace / Repo-specific / User-local)              │
│                                                                               │
│  Variable                    Value                  Used By      Action       │
│  ──────────────────────────────────────────────────────────────────────────   │
│  ANTHROPIC_API_KEY           ••••••••••••••••  [👁] AI Agents   [Edit] [×]  │
│  GITHUB_PAT                  ••••••••••••••••  [👁] Git Ops     [Edit] [×]  │
│  JIRA_API_TOKEN              ••••••••••••••••  [👁] Jira        [Edit] [×]  │
│  DATABASE_URL                ••••••••••••••••  [👁] Backend     [Edit] [×]  │
│  ENCRYPTION_KEY              ••••••••••••••••  [👁] Backend     [Edit] [×]  │
│                                                                               │
│  [+ Add Variable]                                                             │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ Variable Name        Value                                               │ │
│  │ ┌────────────────┐   ┌──────────────────────────────────────────────┐  │ │
│  │ │ MY_NEW_VAR     │   │ my-secret-value                          [👁] │  │ │
│  │ └────────────────┘   └──────────────────────────────────────────────┘  │ │
│  │                                                   [Cancel] [Save]       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```
