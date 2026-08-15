package com.sportslobby.auth.application;

import com.sportslobby.auth.api.ForgotPasswordRequest;
import com.sportslobby.auth.api.GoogleAuthRequest;
import com.sportslobby.auth.api.ChangeUnverifiedPhoneRequest;
import com.sportslobby.auth.api.LoginRequest;
import com.sportslobby.auth.api.LogoutRequest;
import com.sportslobby.auth.api.OtpRequest;
import com.sportslobby.auth.api.OtpResponse;
import com.sportslobby.auth.api.OtpVerifyRequest;
import com.sportslobby.auth.api.PhoneChangeResponse;
import com.sportslobby.auth.api.RefreshTokenRequest;
import com.sportslobby.auth.api.RegisterPlayerRequest;
import com.sportslobby.auth.api.ResetPasswordRequest;
import com.sportslobby.auth.domain.AuthTokens;
import com.sportslobby.auth.domain.LegalDocumentType;
import com.sportslobby.auth.domain.OtpChallenge;
import com.sportslobby.auth.domain.OtpPurpose;
import com.sportslobby.auth.domain.PasswordResetToken;
import com.sportslobby.auth.domain.RefreshSession;
import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.auth.domain.UserStatus;
import com.sportslobby.auth.integration.OtpSender;
import com.sportslobby.auth.integration.GoogleIdentity;
import com.sportslobby.auth.integration.GoogleIdentityVerifier;
import com.sportslobby.auth.integration.PasswordResetSender;
import com.sportslobby.auth.persistence.AuthRepository;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.security.AccessTokenService;
import com.sportslobby.security.AuthenticatedUser;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {
    private static final String TEST_OTP_CODE = "999999";
    public static final String LEGAL_DOCUMENT_VERSION = "2026-08-14";

    private final AuthRepository authRepository;
    private final PasswordEncoder passwordEncoder;
    private final AccessTokenService accessTokenService;
    private final TokenHashingService tokenHashingService;
    private final OtpSender otpSender;
    private final PasswordResetSender passwordResetSender;
    private final GoogleIdentityVerifier googleIdentityVerifier;
    private final AuthProperties authProperties;
    private final Clock clock;
    private final String dummyPasswordHash;

    public AuthService(
        AuthRepository authRepository,
        PasswordEncoder passwordEncoder,
        AccessTokenService accessTokenService,
        TokenHashingService tokenHashingService,
        OtpSender otpSender,
        PasswordResetSender passwordResetSender,
        GoogleIdentityVerifier googleIdentityVerifier,
        AuthProperties authProperties,
        Clock clock
    ) {
        this.authRepository = authRepository;
        this.passwordEncoder = passwordEncoder;
        this.accessTokenService = accessTokenService;
        this.tokenHashingService = tokenHashingService;
        this.otpSender = otpSender;
        this.passwordResetSender = passwordResetSender;
        this.googleIdentityVerifier = googleIdentityVerifier;
        this.authProperties = authProperties;
        this.clock = clock;
        this.dummyPasswordHash = passwordEncoder.encode(tokenHashingService.newOpaqueToken());
    }

    @Transactional
    public AuthResult registerPlayer(RegisterPlayerRequest request) {
        String email = normalizeEmail(request.email());
        String phoneE164 = normalizePhone(request.phoneE164());

        if (authRepository.emailExists(email)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Email is already registered.");
        }
        if (authRepository.phoneExists(phoneE164)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Phone number is already registered.");
        }

        UUID userId = UUID.randomUUID();
        String firstName = normalizeName(request.firstName());
        String lastName = normalizeName(request.lastName());
        authRepository.createPlayerUser(
            userId,
            firstName,
            lastName,
            email,
            phoneE164,
            passwordEncoder.encode(request.password())
        );
        authRepository.addRole(userId, UserRole.PLAYER);
        authRepository.createPlayerProfile(userId, firstName + " " + lastName);
        recordLegalConsents(userId, Instant.now(clock));
        requestPhoneVerification(phoneE164, userId);

        UserAccount user = authRepository.findUserById(userId).orElseThrow();
        return new AuthResult(user, issueTokens(user, request.deviceLabel()));
    }

    @Transactional
    public AuthResult login(LoginRequest request) {
        Optional<UserAccount> account = authRepository.findUserByPhone(normalizePhone(request.phoneE164()));
        String storedHash = account.map(UserAccount::passwordHash)
            .filter(hash -> hash != null && !hash.isBlank())
            .orElse(dummyPasswordHash);
        boolean passwordMatches = passwordEncoder.matches(request.password(), storedHash);
        if (account.isEmpty() || !passwordMatches || account.get().passwordHash() == null) {
            throw invalidCredentials();
        }
        UserAccount user = account.get();

        if (user.status() == UserStatus.SUSPENDED || user.status() == UserStatus.DELETED) {
            throw new ApiException(HttpStatus.FORBIDDEN, ApiErrorCode.FORBIDDEN, "Account is not allowed to sign in.");
        }

        return new AuthResult(user, issueTokens(user, request.deviceLabel()));
    }

    @Transactional
    public OtpResponse requestOtp(OtpRequest request) {
        String phoneE164 = normalizePhone(request.phoneE164());
        return authRepository.findUserByPhone(phoneE164)
            .map(user -> requestPhoneVerification(phoneE164, user.id()))
            .orElseGet(() -> {
                Instant now = Instant.now(clock);
                return new OtpResponse(
                    "ACCEPTED",
                    now.plus(authProperties.otp().ttl()),
                    now.plus(authProperties.otp().resendCooldown())
                );
            });
    }

    @Transactional
    public UserAccount verifyOtp(OtpVerifyRequest request) {
        String phoneE164 = normalizePhone(request.phoneE164());
        Instant now = Instant.now(clock);
        OtpChallenge challenge = authRepository.findLatestOtpChallenge(phoneE164, OtpPurpose.PHONE_VERIFICATION)
            .orElseThrow(this::invalidOtp);

        if (challenge.consumedAt() != null || !challenge.expiresAt().isAfter(now)) {
            throw invalidOtp();
        }
        if (challenge.attemptCount() >= challenge.maxAttempts()) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, ApiErrorCode.RATE_LIMITED, "OTP attempt limit reached.");
        }

        boolean validTestOtp = authProperties.otp().testCodeEnabled() && TEST_OTP_CODE.equals(request.code());
        String submittedHash = tokenHashingService.hashOtp(challenge.id(), request.code(), phoneE164);
        if (!validTestOtp && !submittedHash.equals(challenge.codeHash())) {
            authRepository.incrementOtpAttempts(challenge.id());
            throw invalidOtp();
        }

        authRepository.consumeOtpChallenges(phoneE164, OtpPurpose.PHONE_VERIFICATION, now);
        authRepository.markPhoneVerified(phoneE164, now);
        return authRepository.findUserByPhone(phoneE164).orElseThrow();
    }

    @Transactional
    public AuthResult refresh(RefreshTokenRequest request) {
        Instant now = Instant.now(clock);
        String tokenHash = tokenHashingService.hashToken(request.refreshToken());
        RefreshSession existingSession = authRepository.findRefreshSessionByHash(tokenHash)
            .orElseThrow(this::invalidRefreshToken);

        if (!existingSession.isUsableAt(now)) {
            if (existingSession.revokedAt() != null && existingSession.replacedBySessionId() != null) {
                authRepository.revokeAllRefreshSessions(existingSession.userId(), now);
            }
            throw invalidRefreshToken();
        }

        UserAccount user = authRepository.findUserById(existingSession.userId()).orElseThrow(this::invalidRefreshToken);
        ensureCanUseSession(user);

        String newRefreshToken = tokenHashingService.newOpaqueToken();
        RefreshSession newSession = createRefreshSession(user.id(), existingSession.deviceLabel(), newRefreshToken, now);
        authRepository.createRefreshSession(newSession);
        authRepository.revokeRefreshSession(existingSession.id(), now, newSession.id());

        return new AuthResult(user, issueAccessAndRefresh(user, newRefreshToken, newSession.expiresAt()));
    }

    @Transactional
    public void logout(LogoutRequest request) {
        Instant now = Instant.now(clock);
        String tokenHash = tokenHashingService.hashToken(request.refreshToken());
        authRepository.findRefreshSessionByHash(tokenHash).ifPresent(session -> {
            if (request.allDevices()) {
                authRepository.revokeAllRefreshSessions(session.userId(), now);
            } else {
                authRepository.revokeRefreshSession(session.id(), now, null);
            }
        });
    }

    @Transactional
    public void requestPasswordReset(ForgotPasswordRequest request) {
        String phoneE164 = normalizePhone(request.phoneE164());
        authRepository.findUserByPhone(phoneE164).ifPresent(user -> {
            String resetToken = tokenHashingService.newOpaqueToken();
            Instant now = Instant.now(clock);
            PasswordResetToken token = new PasswordResetToken(
                UUID.randomUUID(),
                user.id(),
                tokenHashingService.hashToken(resetToken),
                now.plus(authProperties.passwordReset().ttl()),
                null,
                now
            );
            authRepository.createPasswordResetToken(token);
            passwordResetSender.send(phoneE164, resetToken);
        });
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        Instant now = Instant.now(clock);
        PasswordResetToken resetToken = authRepository.findPasswordResetTokenByHash(
                tokenHashingService.hashToken(request.resetToken())
            )
            .orElseThrow(this::invalidPasswordResetToken);

        if (!resetToken.isUsableAt(now)) {
            throw invalidPasswordResetToken();
        }

        String newPasswordHash = passwordEncoder.encode(request.newPassword());
        authRepository.updatePasswordHash(resetToken.userId(), newPasswordHash, now);
        authRepository.consumePasswordResetToken(resetToken.id(), now);
        authRepository.revokeAllRefreshSessions(resetToken.userId(), now);
    }

    public OtpResponse requestPhoneVerification(String phoneE164, UUID userId) {
        Instant now = Instant.now(clock);
        authRepository.findLatestOtpChallenge(phoneE164, OtpPurpose.PHONE_VERIFICATION)
            .filter(challenge -> challenge.consumedAt() == null)
            .filter(challenge -> challenge.resendAvailableAt().isAfter(now))
            .ifPresent(challenge -> {
                throw new ApiException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    ApiErrorCode.RATE_LIMITED,
                    "OTP was requested too recently."
                );
            });

        UUID challengeId = UUID.randomUUID();
        String code = tokenHashingService.newOtpCode();
        OtpChallenge challenge = new OtpChallenge(
            challengeId,
            phoneE164,
            OtpPurpose.PHONE_VERIFICATION,
            tokenHashingService.hashOtp(challengeId, code, phoneE164),
            now.plus(authProperties.otp().ttl()),
            null,
            0,
            authProperties.otp().maxAttempts(),
            now.plus(authProperties.otp().resendCooldown()),
            userId,
            now
        );
        authRepository.createOtpChallenge(challenge);
        otpSender.send(phoneE164, code, OtpPurpose.PHONE_VERIFICATION);
        return new OtpResponse("ACCEPTED", challenge.expiresAt(), challenge.resendAvailableAt());
    }

    @Transactional
    public AuthResult googleSignIn(GoogleAuthRequest request) {
        GoogleIdentity identity = googleIdentityVerifier.verify(request.idToken());
        UserAccount existing = authRepository.findUserByExternalIdentity("GOOGLE", identity.subject()).orElse(null);
        if (existing != null) {
            ensureCanUseSession(existing);
            return new AuthResult(existing, issueTokens(existing, request.deviceLabel()));
        }

        String email = normalizeEmail(identity.email());
        if (authRepository.emailExists(email)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "This email already has an account. Sign in with the existing method before linking Google."
            );
        }
        if (request.phoneE164() == null || request.phoneE164().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Phone number is required for a new Google account.");
        }
        if (!Boolean.TRUE.equals(request.acceptedTerms()) || !Boolean.TRUE.equals(request.acceptedPrivacy())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Terms and Privacy Policy acceptance is required.");
        }

        String phone = normalizePhone(request.phoneE164());
        if (authRepository.phoneExists(phone)) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "This phone already has an account. Sign in with the existing method before linking Google."
            );
        }

        Instant now = Instant.now(clock);
        UUID userId = UUID.randomUUID();
        String firstName = normalizeName(identity.firstName());
        String lastName = normalizeName(identity.lastName());
        authRepository.createPlayerUser(userId, firstName, lastName, email, phone, null);
        authRepository.addRole(userId, UserRole.PLAYER);
        authRepository.createPlayerProfile(userId, firstName + " " + lastName);
        authRepository.createExternalIdentity(UUID.randomUUID(), userId, "GOOGLE", identity.subject(), now);
        recordLegalConsents(userId, now);
        requestPhoneVerification(phone, userId);

        UserAccount user = authRepository.findUserById(userId).orElseThrow();
        return new AuthResult(user, issueTokens(user, request.deviceLabel()));
    }

    public void recordLegalConsents(UUID userId, Instant acceptedAt) {
        authRepository.recordLegalConsent(
            UUID.randomUUID(), userId, LegalDocumentType.TERMS_OF_SERVICE, LEGAL_DOCUMENT_VERSION, acceptedAt
        );
        authRepository.recordLegalConsent(
            UUID.randomUUID(), userId, LegalDocumentType.PRIVACY_POLICY, LEGAL_DOCUMENT_VERSION, acceptedAt
        );
    }

    @Transactional
    public PhoneChangeResponse changeUnverifiedPhone(
        ChangeUnverifiedPhoneRequest request,
        AuthenticatedUser authenticatedUser
    ) {
        if (authenticatedUser == null) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHENTICATED, "Authentication is required.");
        }

        UserAccount user = authRepository.findUserById(authenticatedUser.userId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Account not found."));
        if (user.phoneVerifiedAt() != null) {
            throw new ApiException(
                HttpStatus.CONFLICT,
                ApiErrorCode.CONFLICT,
                "This recovery path is only available before phone verification."
            );
        }
        if (user.passwordHash() != null && (
            request.currentPassword() == null ||
            !passwordEncoder.matches(request.currentPassword(), user.passwordHash())
        )) {
            throw invalidCredentials();
        }

        String newPhone = normalizePhone(request.phoneE164());
        if (newPhone.equals(user.phoneE164())) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Enter a different phone number.");
        }
        if (authRepository.phoneExists(newPhone)) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Phone number is already registered.");
        }

        Instant now = Instant.now(clock);
        authRepository.consumeOtpChallenges(user.phoneE164(), OtpPurpose.PHONE_VERIFICATION, now);
        try {
            if (!authRepository.updateUnverifiedPhone(user.id(), user.phoneE164(), newPhone, now)) {
                throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Phone verification state changed. Try again.");
            }
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(HttpStatus.CONFLICT, ApiErrorCode.CONFLICT, "Phone number is already registered.");
        }
        OtpResponse otp = requestPhoneVerification(newPhone, user.id());
        return new PhoneChangeResponse(newPhone, otp);
    }

    private AuthTokens issueTokens(UserAccount user, String deviceLabel) {
        return issueTokensFor(user, deviceLabel);
    }

    @Transactional
    public AuthTokens issueTokensFor(UserAccount user, String deviceLabel) {
        Instant now = Instant.now(clock);
        String refreshToken = tokenHashingService.newOpaqueToken();
        RefreshSession refreshSession = createRefreshSession(user.id(), deviceLabel, refreshToken, now);
        authRepository.createRefreshSession(refreshSession);
        return issueAccessAndRefresh(user, refreshToken, refreshSession.expiresAt());
    }

    private RefreshSession createRefreshSession(UUID userId, String deviceLabel, String refreshToken, Instant now) {
        return new RefreshSession(
            UUID.randomUUID(),
            userId,
            tokenHashingService.hashToken(refreshToken),
            sanitizeOptional(deviceLabel),
            now.plus(authProperties.refreshTokenTtl()),
            null,
            null,
            now,
            null
        );
    }

    private AuthTokens issueAccessAndRefresh(UserAccount user, String refreshToken, Instant refreshTokenExpiresAt) {
        AccessTokenService.IssuedAccessToken accessToken = accessTokenService.issue(user);
        return new AuthTokens(
            accessToken.token(),
            accessToken.expiresAt(),
            refreshToken,
            refreshTokenExpiresAt
        );
    }

    private void ensureCanUseSession(UserAccount user) {
        if (user.status() == UserStatus.SUSPENDED || user.status() == UserStatus.DELETED) {
            throw invalidRefreshToken();
        }
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizePhone(String phoneE164) {
        return phoneE164.trim();
    }

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }

    private String sanitizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
    }

    private ApiException invalidCredentials() {
        return new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHENTICATED, "Invalid phone number or password.");
    }

    private ApiException invalidOtp() {
        return new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Invalid or expired OTP.");
    }

    private ApiException invalidRefreshToken() {
        return new ApiException(HttpStatus.UNAUTHORIZED, ApiErrorCode.UNAUTHENTICATED, "Invalid refresh token.");
    }

    private ApiException invalidPasswordResetToken() {
        return new ApiException(HttpStatus.BAD_REQUEST, ApiErrorCode.VALIDATION_ERROR, "Invalid or expired password reset token.");
    }

    public record AuthResult(UserAccount user, AuthTokens tokens) {
    }
}
