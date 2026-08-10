package com.sportslobby.auth.integration;

public interface PasswordResetSender {
    void send(String phoneE164, String resetToken);
}
