package com.sportslobby.auth.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.auth.google")
public record GoogleAuthProperties(boolean enabled, String clientId) {
}
