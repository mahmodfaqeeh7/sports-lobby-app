package com.sportslobby.auth.integration;

public interface GoogleIdentityVerifier {
    GoogleIdentity verify(String idToken);
}
