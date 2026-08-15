# Platform Configuration

Business policy must be centrally configurable where change is expected. Configuration is not a replacement for versioned product decisions; it is for approved tunable values.

## Recommended configurable keys

### Reservations
- default player cancellation window (initially 12 hours)
- join cutoff before start
- maximum active future reservations per player if introduced
- outstanding-balance threshold that blocks new reservations

### Lobbies
- default confirmation deadline lead time
- default underfilled action
- vendor response/extension window
- minimum/maximum sensible capacity limits

### Penalties
- no-show strike weights
- late-cancellation strike weights
- warning/restriction thresholds
- restriction durations
- vendor late-cancellation threshold and consequences

### Notifications
- reminder offsets
- resend/retry limits
- promotional defaults

### Authentication
- OTP expiry
- OTP resend cooldown
- OTP maximum attempts
- password-reset expiry
- Google OAuth enabled flag and Web OAuth client ID
- version identifiers for Terms of Service and Privacy Policy acceptance

Google sign-in requires all of the following environment/application configuration:

- backend: `SPORTS_LOBBY_GOOGLE_AUTH_ENABLED=true` and `SPORTS_LOBBY_GOOGLE_WEB_CLIENT_ID`;
- mobile: matching `GOOGLE_WEB_CLIENT_ID` and `GOOGLE_IOS_CLIENT_ID` values in `mobile/.env`;
- Google Cloud: an Android OAuth client for package `com.sportslobby` and each signing SHA-1;
- iOS: an OAuth client for bundle `com.sportslobby` and its reversed client ID registered as a URL scheme.

OAuth client IDs are public identifiers. Provider secrets must still remain outside the repository.

### Files
- max image/document sizes
- allowed MIME types
- signed URL expiry

Production KYC files use private S3-compatible object storage. Set `SPORTS_LOBBY_FILES_PROVIDER=s3`, `AWS_REGION`, and, only for a non-AWS provider, `SPORTS_LOBBY_S3_ENDPOINT` and `SPORTS_LOBBY_S3_PATH_STYLE`. Supply AWS credentials through workload identity or the deployment secret manager. The API issues short-lived PUT/GET URLs and confirms an upload with object metadata before it can be reviewed or approved.

### Production authentication and transport

Set `SPORTS_LOBBY_PRODUCTION_MODE=true` in the production deployment. Startup then fails closed unless:

- the development JWT secret has been replaced;
- the test OTP is disabled;
- HTTPS enforcement and authentication rate limiting are enabled;
- Twilio SMS delivery is enabled and configured for OTP and password reset;
- KYC storage uses the S3-compatible provider.

When TLS terminates at a trusted reverse proxy, set `SPORTS_LOBBY_FORWARD_HEADERS_STRATEGY=framework` and make sure the proxy overwrites forwarded headers. Do not expose the application port directly. Mobile release builds require an HTTPS `API_BASE_URL`; Android release builds also disable cleartext traffic and iOS keeps App Transport Security enabled.

The application has bounded per-IP and per-account throttles for login, registration, OTP, password reset, refresh, and Google authentication. For more than one backend replica, also configure the same limits at the load balancer, API gateway, or WAF so counters are shared across replicas.

Twilio settings are `SPORTS_LOBBY_TWILIO_ENABLED=true`, `TWILIO_ACCOUNT_SID`, either the recommended `TWILIO_API_KEY_SID` and `TWILIO_API_KEY_SECRET` pair or the legacy `TWILIO_AUTH_TOKEN`, and either `TWILIO_FROM_NUMBER` or `TWILIO_MESSAGING_SERVICE_SID`.

Android production signing credentials are read from `SPORTS_LOBBY_ANDROID_KEYSTORE_PATH`, `SPORTS_LOBBY_ANDROID_KEYSTORE_PASSWORD`, `SPORTS_LOBBY_ANDROID_KEY_ALIAS`, and `SPORTS_LOBBY_ANDROID_KEY_PASSWORD`. Keep them in CI/deployment secrets, not `mobile/.env` or source control.

### Geography/commerce
- enabled countries
- enabled currencies
- enabled payment methods/providers

Facility location selection uses native Apple Maps on iOS and Google Maps on Android. Apple Maps needs no additional key. Android builds require the Google Maps SDK for Android to be enabled and `SPORTS_LOBBY_GOOGLE_MAPS_API_KEY` supplied either as an environment variable or a Gradle property. Restrict the key to the Android application ID `com.sportslobby` and the SHA-1 fingerprints of the allowed signing certificates. The user chooses a pin on the map; latitude and longitude are stored automatically and are not manual form fields.

## Rules

- Values must have safe defaults and validation ranges.
- Sensitive secrets are not stored in `system_settings`; use a secret manager/environment configuration.
- Important policy changes are audited with actor and timestamp.
- A setting change must not silently rewrite historical reservation/payment obligations. Snapshot policy values when historical interpretation requires it.
- Mobile should not own policy constants that control server authorization or penalties.
