package com.sportslobby.auth.integration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.sms.twilio")
public record TwilioSmsProperties(
    boolean enabled,
    String accountSid,
    String authToken,
    String apiKeySid,
    String apiKeySecret,
    String fromNumber,
    String messagingServiceSid
) {
    public TwilioSmsProperties {
        if (enabled) {
            require("app.sms.twilio.account-sid", accountSid);
            if (!isBlank(apiKeySid) || !isBlank(apiKeySecret)) {
                require("app.sms.twilio.api-key-sid", apiKeySid);
                require("app.sms.twilio.api-key-secret", apiKeySecret);
            } else {
                require("app.sms.twilio.auth-token", authToken);
            }
            if (isBlank(fromNumber) && isBlank(messagingServiceSid)) {
                throw new IllegalArgumentException(
                    "Configure app.sms.twilio.from-number or app.sms.twilio.messaging-service-sid."
                );
            }
        }
    }

    boolean usesMessagingService() {
        return !isBlank(messagingServiceSid);
    }

    String authenticationUsername() {
        return hasApiKeyCredentials() ? apiKeySid : accountSid;
    }

    String authenticationPassword() {
        return hasApiKeyCredentials() ? apiKeySecret : authToken;
    }

    private boolean hasApiKeyCredentials() {
        return !isBlank(apiKeySid) || !isBlank(apiKeySecret);
    }

    private static void require(String propertyName, String value) {
        if (isBlank(value)) {
            throw new IllegalArgumentException(propertyName + " is required when Twilio SMS is enabled.");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
