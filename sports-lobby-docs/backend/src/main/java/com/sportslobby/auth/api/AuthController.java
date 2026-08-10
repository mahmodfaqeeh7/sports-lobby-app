package com.sportslobby.auth.api;

import com.sportslobby.auth.application.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(@Valid @RequestBody RegisterPlayerRequest request) {
        return AuthResponse.from(authService.registerPlayer(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return AuthResponse.from(authService.login(request));
    }

    @PostMapping("/otp/request")
    public OtpResponse requestOtp(@Valid @RequestBody OtpRequest request) {
        return authService.requestOtp(request);
    }

    @PostMapping("/otp/verify")
    public UserResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return UserResponse.from(authService.verifyOtp(request));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request) {
        return AuthResponse.from(authService.refresh(request));
    }

    @PostMapping("/logout")
    public GenericStatusResponse logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return GenericStatusResponse.accepted();
    }

    @PostMapping("/password/forgot")
    public GenericStatusResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request);
        return GenericStatusResponse.accepted();
    }

    @PostMapping("/password/reset")
    public GenericStatusResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        return GenericStatusResponse.accepted();
    }
}
