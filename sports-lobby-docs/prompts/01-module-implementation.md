# Codex Prompt - Implement a Module Slice

Replace placeholders.

```text
Implement: <FEATURE / VERTICAL SLICE>

Read first:
- AGENTS.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/BUSINESS_RULES.md
- docs/STATE_MACHINES.md
- docs/API_DESIGN.md
- docs/modules/<MODULE>.md
<add only other relevant docs>

Goal:
<one concrete user/business outcome>

Scope:
- <item>
- <item>
- <item>

Out of scope:
- <explicitly exclude adjacent future features>

Before coding:
1. inspect existing related code
2. identify reusable components/services
3. give a short implementation plan
4. list files/migrations/contracts expected to change
5. call out concurrency/security/payment risks if relevant

Implementation requirements:
- backend remains source of truth
- preserve documented state transitions
- add server validation and authorization
- add client loading/error/empty/success behavior
- add tests for important business logic
- do not refactor unrelated modules

Done when:
- feature works end-to-end
- compile/typecheck/lint pass
- relevant tests pass
- migration/API docs updated if behavior changed
- diff contains no unrelated changes
```
