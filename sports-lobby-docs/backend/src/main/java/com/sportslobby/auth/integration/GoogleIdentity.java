package com.sportslobby.auth.integration;

public record GoogleIdentity(String subject, String email, String firstName, String lastName) {
}
