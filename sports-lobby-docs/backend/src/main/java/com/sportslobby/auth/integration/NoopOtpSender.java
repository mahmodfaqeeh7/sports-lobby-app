package com.sportslobby.auth.integration;

import com.sportslobby.auth.domain.OtpPurpose;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.sms.twilio", name = "enabled", havingValue = "false", matchIfMissing = true)
public class NoopOtpSender implements OtpSender {

    @Override
    public void send(String phoneE164, String code, OtpPurpose purpose) {
        // Production SMS providers are added behind this interface. OTP codes are intentionally not logged.
    }
}
