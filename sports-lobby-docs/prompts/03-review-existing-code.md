# Codex Prompt - Review Before Continuing

```text
Review the current implementation against the project documentation.

Read:
- AGENTS.md
- docs/INDEX.md
- the docs relevant to the code being reviewed

Do NOT modify files yet.

Report:
1. behavior that contradicts requirements
2. security/authorization problems
3. reservation/payment concurrency risks
4. database design inconsistencies
5. duplicated abstractions
6. missing tests
7. hardcoded policy values that should be configuration
8. documentation that became stale

Rank findings:
- Critical
- High
- Medium
- Low

For each finding include:
- file/path
- why it matters
- recommended fix

Then propose the smallest safe implementation sequence.
```
