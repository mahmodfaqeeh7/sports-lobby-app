# Module: Profile and Account Settings

## Purpose
Provide safe self-service management of profile, account, preferences, privacy, and sessions.

## Player profile
- first/last/display name;
- profile image;
- verified phone;
- email;
- optional home city/country;
- sport preferences;
- favorite venues;
- basic statistics link/view.

## Account settings
- change password;
- change phone with re-verification;
- change email with verification as required;
- notification preferences;
- language/locale when localization is introduced;
- session/device management;
- logout all sessions;
- request account deletion/deactivation.

## Rules
- changing phone never changes user primary ID;
- sensitive changes require recent authentication/verification when appropriate;
- computed player statistics cannot be edited;
- deletion/deactivation must preserve required reservation/payment/audit history.

## Vendor settings
Vendor owner profile/account settings are separate from business/venue settings. Changing account email/phone must not silently mutate venue contact data unless the user explicitly chooses to synchronize it.
