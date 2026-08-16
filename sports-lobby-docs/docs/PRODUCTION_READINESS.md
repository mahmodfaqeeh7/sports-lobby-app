# Production Readiness Checklist

The application is not production-ready until every applicable launch gate
below is complete and verified in a staging environment that mirrors
production. Production must use separate accounts, databases, buckets, keys,
and provider projects from local development.

## 1. Product launch scope

- [ ] Freeze the first release scope and remove or disable incomplete flows.
- [ ] Complete the customer-ready player, vendor, and admin UX for that scope.
- [ ] Decide whether payments are required at launch. If required, implement a
  provider, signed webhooks, idempotency, refunds, and a ledger. Never collect
  card data directly.
- [ ] Complete required notifications, cancellation/penalty policy, attendance,
  reporting/moderation, support, and account deletion/export behavior.
- [ ] Validate pricing, currencies, supported countries, time zones, and legal
  business rules with product/legal owners.

## 2. Production infrastructure

- [ ] Provision a managed PostgreSQL database with TLS, automated backups,
  point-in-time recovery, monitoring, and tested restore procedures.
- [ ] Provision private S3 storage for KYC documents with least-privilege IAM,
  encryption, lifecycle rules, access logging, and no public bucket access.
- [ ] Deploy the backend behind a trusted TLS load balancer/API gateway. Do not
  expose the Spring Boot port directly.
- [ ] Configure DNS, certificates, WAF/gateway rate limits, network controls,
  health checks, graceful deployment, and rollback.
- [ ] Choose a secret manager and workload identity. Do not deploy a committed
  `.env.production` file or long-lived AWS credentials.

## 3. Backend production profile

Run with `SPRING_PROFILES_ACTIVE=prod`. Supply the keys from
`backend/.env.production.example` through the deployment environment/secret
manager. At minimum:

- [ ] production PostgreSQL URL, username, and password;
- [ ] a cryptographically random JWT access-token secret of at least 32 bytes;
- [ ] private S3 bucket, region, and workload credentials;
- [ ] Twilio account plus API key secret and sender/messaging service;
- [ ] Google OAuth settings if Google sign-in is enabled;
- [ ] production policy TTLs, upload limits, and rate-limit capacity.

The `prod` profile forces HTTPS, Twilio, S3, rate limiting, production readiness
validation, and disables test OTP `999999` and admin bootstrap. A startup
failure is a release blocker, not a setting to bypass.

## 4. Authentication and privacy

- [ ] Verify real SMS OTP and password reset delivery, expiration, cooldown,
  abuse limits, and provider failure/retry behavior.
- [ ] Review JWT key rotation, refresh-token revocation, logout-all-devices,
  password policy, account lock/recovery, and compromised-account procedures.
- [ ] Configure Google Android/iOS/web OAuth clients, package/bundle IDs, signing
  fingerprints, and iOS URL schemes when Google sign-in is enabled.
- [ ] Add malware scanning or an accepted documented risk decision for KYC
  uploads; verify MIME, size, ownership, signed URL expiry, and audit access.
- [ ] Complete privacy policy, terms, consent versions, retention/deletion
  policy, vendor KYC handling policy, and data-subject request process.
- [ ] Perform threat modeling, dependency/security scanning, and an external
  penetration test before handling real identity documents or payments.

## 5. Mobile release configuration

- [ ] Create `mobile/.env.production` from its example with an HTTPS API URL and
  public OAuth client IDs only.
- [ ] Configure Android upload/app-signing keys in CI secrets and restrict the
  Google Maps key by application ID and signing SHA-1.
- [ ] Configure Apple signing, provisioning, capabilities, privacy manifest,
  usage descriptions, associated OAuth URL scheme, and App Store privacy data.
- [ ] Set production application identifiers, semantic version, build number,
  icons, launch assets, store metadata, support URL, and privacy-policy URL.
- [ ] Test release builds, not only Debug builds, on representative physical
  Android and iOS devices and on slow/unreliable networks.
- [ ] Confirm release builds contain no local URLs, test accounts, test OTP,
  private credentials, verbose sensitive logs, or cleartext exceptions.

## 6. Quality and operations

- [ ] Add CI gates for backend tests, mobile lint/typecheck/tests, Flyway
  validation, dependency scanning, secret scanning, and release builds.
- [ ] Add broader integration/end-to-end coverage for signup/OTP, vendor KYC,
  admin decisions, venue/court/lobby ownership, publish restrictions,
  reservation cancellation, and token refresh/revocation.
- [ ] Keep and run the final-seat concurrency test against production-equivalent
  PostgreSQL. Exactly one request may win the final seat.
- [ ] Add structured production logs, error tracking, metrics, traces/request
  IDs, dashboards, and alerts without logging OTPs, tokens, passwords, or KYC.
- [ ] Create operational tools/runbooks for vendor review, user support,
  suspension, incident response, data restore, provider outage, and key rotation.
- [ ] Load test discovery, login/OTP, uploads, lobby publishing, and reservation
  concurrency at expected launch traffic.

## 7. Staging and release gate

- [ ] Maintain a staging environment with its own database, S3 bucket, SMS test
  sender, OAuth clients, and release-like HTTPS topology.
- [ ] Run Flyway before deployment, smoke-test health/auth/core journeys, and
  prove application rollback without requiring unsafe database rollback.
- [ ] Restore a recent backup into an isolated environment and verify data.
- [ ] Complete user acceptance testing and accessibility testing.
- [ ] Obtain explicit product, engineering, security/privacy, and operations
  approval before production traffic is enabled.

