# Codex Prompt - Plan a New Feature

```text
I want to add this feature:
<FEATURE DESCRIPTION>

Do not code yet.

Read:
- AGENTS.md
- docs/PRODUCT_REQUIREMENTS.md
- docs/ARCHITECTURE.md
- docs/DATABASE.md
- docs/BUSINESS_RULES.md
- relevant module docs
- docs/ROADMAP.md

Produce:
1. product assumptions/open questions
2. affected modules
3. data model changes
4. API changes
5. mobile screens/components
6. authorization/security concerns
7. concurrency/payment considerations
8. notifications/events
9. migration/backward-compatibility concerns
10. test plan
11. recommended implementation slices
12. documentation files that should be updated

Prefer the smallest design consistent with existing architecture. Do not introduce microservices/new databases unless clearly justified.
```
