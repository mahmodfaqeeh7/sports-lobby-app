package com.sportslobby.auth.api;

import com.sportslobby.auth.application.AuthService;
import com.sportslobby.security.AuthenticatedUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/me")
public class AccountController {
    private final AuthService authService;

    public AccountController(AuthService authService) {
        this.authService = authService;
    }

    @PatchMapping("/unverified-phone")
    public PhoneChangeResponse changeUnverifiedPhone(
        @Valid @RequestBody ChangeUnverifiedPhoneRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return authService.changeUnverifiedPhone(request, user);
    }
}
