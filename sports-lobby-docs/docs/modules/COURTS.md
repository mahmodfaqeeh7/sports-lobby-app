# Module: Courts

## Purpose
Represent individual playable fields/courts inside a venue.

## Requirements
- Vendor creates/edits courts for owned venue.
- Court has name/status and supported sports.
- New courts require a public JPEG/PNG/WebP image so players can inspect the booked court.
- Optional default capacity/config.
- Lobbies reference exactly one court and sport.

## Rules
- Court cannot be used if inactive.
- Sport must be supported by the court.
- Prevent overlapping lobbies on the same court unless product explicitly allows overlap (default: disallow overlapping active/published sessions).

## Acceptance criteria
- Cross-vendor court edits forbidden.
- Schedule conflict checked server-side.
- Court image upload ownership, type, size, and completion are validated server-side.
