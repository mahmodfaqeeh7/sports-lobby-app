package com.sportslobby.auth.api;

import com.sportslobby.auth.application.AuthService;
import com.sportslobby.security.AuthRateLimiter;
import com.sportslobby.security.RateLimitPolicy;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuthRateLimiter rateLimiter;

    public AuthController(AuthService authService, AuthRateLimiter rateLimiter) {
        this.authService = authService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public AuthResponse register(
        @Valid @RequestBody RegisterPlayerRequest request,
        HttpServletRequest httpRequest
    ) {
        rateLimiter.check(RateLimitPolicy.PLAYER_SIGNUP_IP, clientIp(httpRequest));
        rateLimiter.check(RateLimitPolicy.SIGNUP_PHONE, request.phoneE164());
        return AuthResponse.from(authService.registerPlayer(request));
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(RateLimitPolicy.LOGIN_IP, clientIp(httpRequest));
        rateLimiter.check(RateLimitPolicy.LOGIN_ACCOUNT, request.phoneE164());
        AuthResponse response = AuthResponse.from(authService.login(request));
        rateLimiter.reset(RateLimitPolicy.LOGIN_ACCOUNT, request.phoneE164());
        return response;
    }

    @PostMapping("/google")
    public AuthResponse google(@Valid @RequestBody GoogleAuthRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(RateLimitPolicy.GOOGLE_IP, clientIp(httpRequest));
        return AuthResponse.from(authService.googleSignIn(request));
    }

    @PostMapping("/otp/request")
    public OtpResponse requestOtp(@Valid @RequestBody OtpRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(RateLimitPolicy.OTP_REQUEST_IP, clientIp(httpRequest));
        rateLimiter.check(RateLimitPolicy.OTP_REQUEST_PHONE, request.phoneE164());
        return authService.requestOtp(request);
    }

    @PostMapping("/otp/verify")
    public UserResponse verifyOtp(@Valid @RequestBody OtpVerifyRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(RateLimitPolicy.OTP_VERIFY_IP, clientIp(httpRequest));
        rateLimiter.check(RateLimitPolicy.OTP_VERIFY_PHONE, request.phoneE164());
        return UserResponse.from(authService.verifyOtp(request));
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshTokenRequest request, HttpServletRequest httpRequest) {
        rateLimiter.check(RateLimitPolicy.REFRESH_IP, clientIp(httpRequest));
        return AuthResponse.from(authService.refresh(request));
    }

    @PostMapping("/logout")
    public GenericStatusResponse logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return GenericStatusResponse.accepted();
    }

    @PostMapping("/password/forgot")
    public GenericStatusResponse forgotPassword(
        @Valid @RequestBody ForgotPasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        rateLimiter.check(RateLimitPolicy.PASSWORD_FORGOT_IP, clientIp(httpRequest));
        rateLimiter.check(RateLimitPolicy.PASSWORD_FORGOT_PHONE, request.phoneE164());
        authService.requestPasswordReset(request);
        return GenericStatusResponse.accepted();
    }

    @PostMapping("/password/reset")
    public GenericStatusResponse resetPassword(
        @Valid @RequestBody ResetPasswordRequest request,
        HttpServletRequest httpRequest
    ) {
        rateLimiter.check(RateLimitPolicy.PASSWORD_RESET_IP, clientIp(httpRequest));
        rateLimiter.check(RateLimitPolicy.PASSWORD_RESET_TOKEN, request.resetToken());
        authService.resetPassword(request);
        return GenericStatusResponse.accepted();
    }

    private String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr() == null ? "unknown" : request.getRemoteAddr();
    }
}
