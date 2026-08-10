package com.sportslobby.admin.application;

import jakarta.validation.constraints.Size;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties(prefix = "app.admin.bootstrap")
public record AdminBootstrapProperties(
    boolean enabled,
    @Size(max = 100) String firstName,
    @Size(max = 100) String lastName,
    @Size(max = 255) String email,
    @Size(max = 20) String phoneE164,
    String password
) {
    private static final String PHONE_PATTERN = "^\\+[1-9][0-9]{7,14}$";

    public AdminBootstrapProperties {
        if (firstName == null || firstName.isBlank()) {
            firstName = "Admin";
        }
        if (lastName == null || lastName.isBlank()) {
            lastName = "User";
        }
        if (enabled) {
            require("app.admin.bootstrap.email", email);
            require("app.admin.bootstrap.phone-e164", phoneE164);
            require("app.admin.bootstrap.password", password);
            if (password.length() < 8 || password.length() > 200) {
                throw new IllegalArgumentException("app.admin.bootstrap.password must be between 8 and 200 characters.");
            }
            if (!email.contains("@")) {
                throw new IllegalArgumentException("app.admin.bootstrap.email must be a valid email address.");
            }
            if (!phoneE164.matches(PHONE_PATTERN)) {
                throw new IllegalArgumentException("app.admin.bootstrap.phone-e164 must be an E.164 phone number.");
            }
        }
    }

    private static void require(String propertyName, String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(propertyName + " is required when admin bootstrap is enabled.");
        }
    }
}
