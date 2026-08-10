# Module: Discovery, Search and Recommendations

## Purpose
Help players find a suitable game quickly by combining sport, location, schedule, price, and availability.

## Inputs
- current device location when permission is granted;
- selected country/city/area when location is unavailable or user prefers manual selection;
- sport;
- date/time range;
- max distance;
- price range;
- minimum available seats;
- optional future skill/rating preferences.

## Search modes

### Nearby
Use exact venue coordinates and user/device coordinates.

### City/area
Allow users to browse by structured city/area without granting location permission.

Both modes must be supported. Location permission is a convenience, not a requirement to use the app.

## Ranking

Initial ranking should be deterministic, not ML-dependent.

Possible score signals:
- same/selected sport;
- soon/relevant start time;
- distance;
- available seats;
- price relevance;
- venue rating later;
- favorites/preferences later.

Never rank a lobby as available when authoritative server state says it cannot be joined.

## Cancellation alternatives

After a lobby is cancelled, recommend alternatives prioritizing:
1. same sport;
2. similar date/time;
3. nearby venue/location;
4. enough available seats;
5. similar price;
6. active verified venue.

Avoid suggesting a game that conflicts with the player's other confirmed reservations.

## API expectations
- bounded filters/ranges;
- pagination/cursor support;
- clear sort option such as RECOMMENDED, SOONEST, NEAREST, PRICE_ASC;
- server returns current availability summary.

## Future
- preference learning;
- favorite sports/times;
- friend participation signal;
- promotion/featured ranking with transparent business rules;
- recommendation experimentation.
