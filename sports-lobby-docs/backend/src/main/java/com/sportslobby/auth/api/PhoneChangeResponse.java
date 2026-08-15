package com.sportslobby.auth.api;

public record PhoneChangeResponse(String phoneE164, OtpResponse otp) {
}
