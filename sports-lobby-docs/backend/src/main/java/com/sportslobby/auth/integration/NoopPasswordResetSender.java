package com.sportslobby.auth.integration;

import org.springframework.stereotype.Component;

@Component
public class NoopPasswordResetSender implements PasswordResetSender {

    @Override
    public void send(String phoneE164, String resetToken) {
        // Production password reset delivery is added behind this interface. Tokens are intentionally not logged.
    }
}
