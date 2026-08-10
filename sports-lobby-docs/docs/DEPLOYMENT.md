# Deployment and Environments

## 1. Environments

At minimum:
- development
- staging
- production

Use separate:
- PostgreSQL databases;
- S3 buckets/prefixes;
- payment credentials;
- SMS credentials;
- push credentials;
- OAuth configuration.

Never use production secrets in development.

## 2. Backend packaging

- Dockerize Spring Boot.
- Externalize configuration.
- Add health/readiness endpoints.
- Graceful shutdown.

## 3. PostgreSQL

Prefer managed PostgreSQL in production.

Requirements:
- automated backups;
- restore testing;
- migration control;
- monitoring;
- TLS where provider supports/requires.

## 4. AWS S3

Separate public media and private verification access policies.

Use least privilege IAM.

## 5. CI pipeline

Typical pull request:
1. format/lint;
2. backend compile/test;
3. mobile typecheck/test;
4. migration validation;
5. security/dependency checks as configured;
6. build artifacts.

## 6. CD pipeline

Staging:
- automatic after merge if desired.

Production:
- controlled promotion;
- run DB migrations with safe ordering;
- deploy backend;
- smoke tests;
- monitor errors/latency.

## 7. Migration strategy

Use expand/contract for risky schema changes:
1. add backward-compatible schema;
2. deploy code capable of old/new state;
3. backfill;
4. switch reads/writes;
5. remove old schema later.

Never make destructive schema changes casually in the same deployment that depends on them.

## 8. Rollback

Application rollback must be possible without assuming DB rollback is safe.

For migrations, prefer forward fixes unless rollback is proven safe.

## 9. Mobile release

Use environment-specific API/config builds and standard App Store/Google Play release process when product reaches release stage.

Do not put secrets in the mobile binary.
