# Codex Prompt - Project Bootstrap

Use this only when creating the initial repository/foundations.

```text
Read first:
- AGENTS.md
- docs/INDEX.md
- docs/ARCHITECTURE.md
- docs/CODING_STANDARDS.md
- docs/AUTH_AND_SECURITY.md
- docs/TESTING.md

Goal:
Bootstrap the project foundation only. Do not implement all product modules.

Create/prepare:
- React Native + TypeScript mobile structure
- Spring Boot modular-monolith backend structure
- PostgreSQL migration tooling
- development configuration strategy
- common API error format
- health endpoints
- initial auth/module boundaries without inventing business behavior
- test infrastructure
- lint/format/typecheck commands

Before coding:
1. inspect the repo
2. propose the exact folder/package structure
3. list dependencies and why each is needed
4. avoid optional libraries unless they solve a current requirement

Done when:
- mobile builds/typechecks
- backend compiles/tests
- DB migration can run
- no secrets are committed
- README setup instructions are updated
```
