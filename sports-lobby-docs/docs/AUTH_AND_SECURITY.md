# Authentication and Security

## 1. Account model

One identity account can have roles such as PLAYER, VENDOR, ADMIN.

Phone number is a highly important verified account attribute but not the immutable database identity.

## 2. Registration

Player fields:
- first name
- last name
- email
- phone number
- password + confirmation on client

Vendor onboarding additionally collects business and verification information via vendor module.

Normalize phone numbers to E.164.

## 3. Phone OTP

Requirements:
- short expiry;
- attempt limit;
- resend cooldown;
- per-phone/IP/device rate limits;
- OTP values never logged;
- successful verification consumes/invalidates the challenge;
- provider integration behind `OtpProvider`.

## 4. Passwords

- Use an approved adaptive hash (Argon2id/bcrypt depending on Spring security standards adopted).
- Never store plaintext or reversible passwords.
- Enforce reasonable password policy without extreme complexity rules.
- Rate limit failed login attempts.

## 5. Google sign-in

- Verify Google identity tokens server-side.
- Use provider subject ID as external identity key.
- Define safe account-linking rules when Google email matches an existing account.
- Still require phone verification where product policy requires it.

## 6. Access and refresh tokens

Recommended:
- short-lived access token;
- longer-lived refresh session;
- refresh token rotation/revocation;
- secure storage on device;
- server ability to revoke sessions after password change/suspicious activity/account suspension.

Do not place sensitive mutable authorization state only inside long-lived JWTs.

## 7. Authorization

Use RBAC plus resource ownership checks.

Examples:
- only approved vendor members can publish for their vendor;
- vendor can only edit owned venues/courts/lobbies;
- player can only cancel own reservation;
- admin-only verification decisions;
- private verification documents accessible only to authorized vendor/admin flows.

## 8. Account restrictions

Reservation restrictions are distinct from total account suspension.

Examples:
- user can log in and see history but cannot create new reservations while balance is due;
- vendor can view historical data but publishing is disabled during suspension.

## 9. Input validation

Validate server-side:
- lengths;
- formats;
- enum values;
- price ranges;
- capacity ranges;
- coordinates;
- schedule overlap/past dates as policy requires;
- file MIME/size;
- ownership IDs.

## 10. File security

AWS S3:
- Private verification docs must not be public.
- Generate short-lived signed access only after authorization.
- Validate upload size/type.
- Consider malware scanning when document upload volume/risks justify it.
- Randomize object keys; never rely on unguessable URL alone as authorization.

## 11. Payment security

- Never store raw card data.
- Use payment provider tokens/hosted SDKs.
- Verify provider webhooks/signatures.
- Payment status is finalized server-side from trusted provider events/API.
- Never log full payment tokens/secrets.

## 12. Abuse protection

Rate-limit or otherwise protect:
- login;
- signup;
- OTP request/verify;
- password reset;
- lobby search scraping if abusive;
- reservation attempts;
- report creation;
- file upload;
- payment/refund endpoints.

## 13. Audit

Audit important actions:
- vendor approve/reject/suspend;
- user/vendor restrictions;
- policy changes;
- manual payment/refund adjustments;
- dispute resolution;
- destructive admin actions.

## 14. Logging privacy

Never log:
- passwords;
- OTP codes;
- access/refresh tokens;
- private document content;
- full provider secrets.

Minimize personal data in logs.

## 15. Transport and environments

- HTTPS only in production.
- Secrets via environment/secret manager, not repository.
- Separate dev/staging/prod credentials and buckets/databases.

## 16. Security testing priorities

Test:
- horizontal authorization (IDOR/BOLA);
- role escalation;
- OTP brute force/rate limiting;
- token revocation/refresh replay;
- reservation race conditions;
- price manipulation;
- payment callback spoofing;
- private S3 object access;
- file upload abuse;
- admin endpoints.
