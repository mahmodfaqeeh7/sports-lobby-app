package com.sportslobby.auth.api;

import com.sportslobby.auth.application.AuthService.AuthResult;

public record AuthResponse(UserResponse user, TokenResponse tokens) {
    public static AuthResponse from(AuthResult result) {
        return new AuthResponse(UserResponse.from(result.user()), TokenResponse.from(result.tokens()));
    }
}
