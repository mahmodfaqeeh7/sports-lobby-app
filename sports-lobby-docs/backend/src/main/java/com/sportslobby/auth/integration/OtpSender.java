package com.sportslobby.auth.integration;

import com.sportslobby.auth.domain.OtpPurpose;

public interface OtpSender {
    void send(String phoneE164, String code, OtpPurpose purpose);
}
