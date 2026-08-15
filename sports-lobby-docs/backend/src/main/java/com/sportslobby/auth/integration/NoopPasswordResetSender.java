package com.sportslobby.auth.integration;

import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

@Component
@ConditionalOnProperty(prefix = "app.sms.twilio", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoopPasswordResetSender implements PasswordResetSender {

    @Override
    public void send(String phoneE164, String resetToken) {
        // Local/test mode only. Tokens are intentionally not logged.
    }
}
