# Module: Venues

## Purpose
Represent a physical sports facility managed by a vendor.

## Data
- name/description;
- country/city/area/address;
- exact latitude/longitude;
- IANA timezone;
- contact info;
- images;
- opening hours;
- status;
- owned courts.

## Requirements
- Vendor can create/edit own venues.
- Admin can inspect/manage according to permissions.
- Player can discover active public venues.
- Search by city/area and nearby coordinates.
- Venue detail shows relevant courts/sports/upcoming lobbies/reviews later.

## Rules
- Suspended/inactive venue cannot host new public lobbies.
- Location coordinates and structured city fields coexist.
- Venue timezone must be explicit, not inferred from phone.

## Future
- holiday/exception opening hours;
- amenities;
- parking/showers/equipment;
- richer geospatial search;
- venue-level promotions.
