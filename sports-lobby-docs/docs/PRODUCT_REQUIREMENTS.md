# Product Requirements

## 1. Vision

Create the easiest way for an individual to find and join a real-world sports game without first assembling a full team, while helping sports venues monetize otherwise empty court/field time.

The product acts as a two-sided marketplace:

- **Players** discover and reserve individual seats in scheduled games.
- **Vendors** publish lobbies, operate venues/courts, fill unused capacity, and manage bookings/business performance.

A social benefit naturally emerges: players meet new people through sport. Social-network features are future scope, not required for the first core versions.

## 2. Initial market and expansion

- Initial country: Jordan.
- Initial target audience: youth and recreational sports players.
- The domain model must not assume Jordan forever.
- Support internationalization-ready concepts: country, city, currency, locale, venue timezone, phone country code, dynamic sports.

## 3. Personas

### Player
Wants to play a sport at a convenient time/place without coordinating an entire group.

Primary goals:
- Find nearby games quickly.
- Know the price, location, time, sport, and remaining seats.
- Reserve confidently.
- Avoid losing money when a vendor/platform cancels.
- Build a reliable participation history.

### Vendor / Venue Owner
Wants to increase court utilization and simplify operations.

Primary goals:
- Publish empty time slots as lobbies.
- Manage venues, courts, images, sports, and schedules.
- See who reserved.
- Reduce no-shows.
- Track occupancy, cancellations, revenue, and operational trends.

### Admin
Wants to keep the marketplace reliable and safe.

Primary goals:
- Verify vendors.
- Manage users/vendors/sports.
- Investigate reports and disputes.
- View platform statistics.
- Configure important policies.
- Audit important actions.

## 4. Product principles

- **Trust first:** clear cancellation/refund behavior and accurate availability.
- **Fast discovery:** a player should reach relevant available lobbies with minimal friction.
- **No overbooking:** capacity correctness is a backend invariant.
- **User satisfaction after failure:** if a lobby is cancelled, refund eligible payments and suggest relevant alternatives.
- **Vendor value beyond lead generation:** operational and analytical tools should make the product useful as a management platform.
- **Configurable policy:** cancellation windows, penalties, reminders, and selected thresholds should be configurable.
- **Progressive sophistication:** do not build tournaments, advanced rankings, or complex social systems before the core marketplace is excellent.

## 5. Core player journey

1. Register using normal signup or Google.
2. Verify phone number using OTP.
3. Allow location permission or select city/area manually.
4. Browse sports/venues/lobbies.
5. Filter by sport, date/time, distance, city, price, availability, and optional future criteria.
6. Open lobby details.
7. Review venue, map, rules, price, seat count, and cancellation policy.
8. Join/reserve one or more allowed seats according to product policy (initial assumption: one seat per player per lobby unless group booking is introduced explicitly).
9. Receive confirmation.
10. Receive reminders/important updates.
11. Attend match.
12. Reservation becomes historical; attendance/statistics update.

## 6. Core vendor journey

1. Register through vendor onboarding.
2. Verify phone/email as configured.
3. Submit business/venue details, exact map position, images, and business/license documents.
4. Remain unable to publicly publish until admin approval.
5. After approval, create/manage venues and courts.
6. Configure supported sports and opening hours.
7. Create a lobby with schedule, capacity, pricing model, cancellation/confirmation configuration, and optional player restrictions.
8. Monitor joins/fullness.
9. Run the game or cancel according to policy.
10. Record attendance/no-shows.
11. Review business statistics and history.

## 7. Admin journey

1. Securely access admin dashboard.
2. Review pending vendors and documents.
3. Approve/reject with recorded reason/history.
4. Manage sports and system configuration.
5. Monitor users, vendors, lobbies, reservations, cancellations, payments, reports, and platform metrics.
6. Review abuse, no-show disputes, vendor cancellation abuse, and suspicious behavior.
7. Apply proportionate restrictions/suspensions.

## 8. Core functional requirements

### Authentication
- Email/phone/password signup where appropriate.
- Google sign-in.
- Phone OTP verification.
- Forgot/reset password.
- Session/logout handling.

### Profiles
- Player profile.
- Vendor owner profile.
- Vendor/business profile.
- Profile/facility images.

### Venue discovery
- Search by city/area.
- Nearby discovery using location coordinates.
- Venue details with sports/courts/images/map.

### Lobby discovery
- Available lobby feed/list.
- Filters: sport, date, time, distance, city/area, price, available seats.
- Sort/ranking may use relevance, time, distance, availability.

### Lobby management
- Vendor creates drafts.
- Verified vendor publishes.
- Minimum/maximum player capacity.
- Total-court-price or price-per-player model.
- Status lifecycle as defined in `STATE_MACHINES.md`.

### Reservations
- Player joins available lobby.
- Capacity enforced transactionally.
- Reservation history.
- Cancellation rules.
- Attendance/no-show record.

### Payments
- Cash/payment-at-venue support.
- Architecture ready for online card/Apple Pay provider integrations.
- Refunds for qualifying cancellations.
- Separate payment status from reservation status.

### Notifications
- Reservation confirmations/changes.
- Lobby reminders.
- Lobby full/cancelled/confirmed events.
- Payment/refund events.
- Vendor verification events.
- Policy warnings.

### Vendor management
- Venues/courts/schedules.
- Booking/reservation visibility.
- Occupancy/revenue/cancellation/no-show analytics.

### Administration
- Users/vendors/venue oversight.
- Verification workflows.
- Sports management.
- Reports/moderation.
- Audit history.
- Policy configuration.

## 9. Quality requirements

- Responsive mobile experience under ordinary Jordan mobile networks.
- Idempotent retry behavior for financial and other retry-sensitive actions.
- Concurrency-safe reservations.
- No unauthorized cross-user/vendor data access.
- Graceful network errors and retries.
- Auditability for important admin/vendor actions.
- Migration-safe data model.

## 10. MVP/core scope

Core versions should prioritize:
- Auth + OTP + Google.
- Vendor onboarding/verification.
- Venue/court/sport management.
- Location/map discovery.
- Lobby creation/discovery/details.
- Seat reservation and concurrency safety.
- Cancellation/no-show rules.
- Cash payment support plus payment-ready design.
- Refund-ready online payment semantics.
- Notifications.
- Admin and vendor dashboards.
- Reports/moderation.
- Basic player statistics.

## 11. Future scope

- Tournaments and brackets.
- Teams.
- Friends/following.
- Lobby chat/group chat.
- Waitlist and automatic replacement seats.
- Online wallet/credits.
- Advanced ranking/leaderboards.
- Detailed player performance statistics.
- Achievements.
- Loyalty/referrals/promotions.
- Vendor subscription plans/featured placement.
- Multi-language and multi-currency.
- Multi-country rollout.
