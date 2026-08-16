# Vendor KYC Test Assets

These files are fake development fixtures and contain no real personal or
business information.

- `test-vendor-logo.png`: square business logo.
- `test-facility-image.jpg`: facility image.
- `test-business-license.pdf`: verification document.

All upload fixtures are under the mobile client's 5 MB limit.

Import the images into the currently booted iOS Simulator Photos library:

```sh
xcrun simctl addmedia booted \
  test-assets/vendor-kyc/test-vendor-logo.png \
  test-assets/vendor-kyc/test-facility-image.jpg
```

For the current document-picker flow, copy all three upload fixtures into the
simulator's Files app or drag them from Finder onto the booted simulator.
