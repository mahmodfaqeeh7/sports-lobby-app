package com.sportslobby.auth.integration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class TwilioSmsPropertiesTests {

    @Test
    void usesApiKeyCredentialsWhenConfigured() {
        TwilioSmsProperties properties = new TwilioSmsProperties(
            true,
            "AC-account",
            null,
            "SK-key",
            "api-secret",
            null,
            "MG-service"
        );

        assertThat(properties.authenticationUsername()).isEqualTo("SK-key");
        assertThat(properties.authenticationPassword()).isEqualTo("api-secret");
        assertThat(properties.usesMessagingService()).isTrue();
    }

    @Test
    void rejectsAnIncompleteApiKeyPair() {
        assertThatThrownBy(() -> new TwilioSmsProperties(
            true,
            "AC-account",
            null,
            "SK-key",
            null,
            "+15551234567",
            null
        ))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("api-key-secret");
    }

    @Test
    void retainsAccountAuthTokenCompatibility() {
        TwilioSmsProperties properties = new TwilioSmsProperties(
            true,
            "AC-account",
            "auth-token",
            null,
            null,
            "+15551234567",
            null
        );

        assertThat(properties.authenticationUsername()).isEqualTo("AC-account");
        assertThat(properties.authenticationPassword()).isEqualTo("auth-token");
    }
}
