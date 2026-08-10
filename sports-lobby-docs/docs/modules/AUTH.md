# Module: Authentication

## Purpose
Provide secure account creation, login, phone verification, Google identity, password recovery, and session management.

## Actors
- Player
- Vendor owner/member
- Admin

## Requirements
- Player registration with first/last name, email, phone, password.
- Vendor owner begins through vendor registration/onboarding.
- Phone OTP verification.
- Login with supported identifier/password.
- Google sign-in.
- Forgot/reset password.
- Refresh/logout/session revocation.

## Business rules
- Phone is normalized E.164.
- Phone verification is required before reservation/publishing capabilities as policy defines.
- Google login does not automatically bypass required phone verification.
- Suspended accounts may have session/access behavior restricted according to admin policy.

## API/use cases
- Register player: `POST /api/v1/auth/register`.
- Request/verify phone OTP: `POST /api/v1/auth/otp/request`, `POST /api/v1/auth/otp/verify`.
- Login with phone/password: `POST /api/v1/auth/login`.
- Refresh rotated sessions: `POST /api/v1/auth/refresh`.
- Logout current/all refresh sessions: `POST /api/v1/auth/logout`.
- Request/complete password reset: `POST /api/v1/auth/password/forgot`, `POST /api/v1/auth/password/reset`.
- Start vendor account.
- Google login/link.

Current implementation note:
- Player registration, phone/password login, OTP verification, bearer access tokens, refresh token rotation/revocation, logout, and password reset are implemented as the authentication foundation.
- OTP and password-reset delivery are behind provider interfaces. The local default adapters do not log or expose codes/tokens.
- Vendor onboarding/verification and Google sign-in remain future work.

## Errors/edge cases
- duplicate phone/email;
- expired/wrong OTP;
- OTP throttled;
- Google account collision/linking;
- revoked refresh token;
- changed phone number;
- account restriction/suspension.

## Acceptance criteria
- OTP cannot be brute-forced without rate limits.
- Tokens can be revoked.
- No plaintext credentials logged/stored.
- Authorization roles originate from backend identity state.
