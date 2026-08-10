# Module: Users and Player Profiles

## Purpose
Manage player-facing account/profile information, preferences, favorites, and basic historical statistics.

## Requirements
- View/edit own profile.
- Profile image via S3-backed file flow.
- Home country/city optional.
- Favorite venues.
- Sport preferences optional.
- View upcoming/history through reservation module.
- Basic statistics: games joined/completed, sports played, attendance/no-show/cancellation metrics.

## Rules
- Statistics are derived from authoritative reservation/attendance history.
- Do not allow users to edit calculated reliability/history values.
- Account deletion must not destroy necessary financial/audit history.

## Future
- friends/following;
- teams;
- public player achievements/rankings;
- advanced sport stats.
