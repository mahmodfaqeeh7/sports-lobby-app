package com.sportslobby.auth.persistence;

import com.sportslobby.auth.domain.OtpChallenge;
import com.sportslobby.auth.domain.OtpPurpose;
import com.sportslobby.auth.domain.PasswordResetToken;
import com.sportslobby.auth.domain.RefreshSession;
import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

public interface AuthRepository {
    boolean emailExists(String email);

    boolean phoneExists(String phoneE164);

    void createUser(UUID userId, String firstName, String lastName, String email, String phoneE164, String passwordHash);

    void createPlayerUser(UUID userId, String firstName, String lastName, String email, String phoneE164, String passwordHash);

    void addRole(UUID userId, UserRole role);

    void createPlayerProfile(UUID userId, String displayName);

    Optional<UserAccount> findUserById(UUID userId);

    Optional<UserAccount> findUserByPhone(String phoneE164);

    void markPhoneVerified(String phoneE164, Instant verifiedAt);

    void updatePasswordHash(UUID userId, String passwordHash, Instant updatedAt);

    Optional<OtpChallenge> findLatestOtpChallenge(String phoneE164, OtpPurpose purpose);

    void createOtpChallenge(OtpChallenge challenge);

    void incrementOtpAttempts(UUID challengeId);

    void consumeOtpChallenges(String phoneE164, OtpPurpose purpose, Instant consumedAt);

    void createRefreshSession(RefreshSession session);

    Optional<RefreshSession> findRefreshSessionByHash(String tokenHash);

    void revokeRefreshSession(UUID sessionId, Instant revokedAt, UUID replacedBySessionId);

    void revokeAllRefreshSessions(UUID userId, Instant revokedAt);

    void markRefreshSessionUsed(UUID sessionId, Instant usedAt);

    void createPasswordResetToken(PasswordResetToken token);

    Optional<PasswordResetToken> findPasswordResetTokenByHash(String tokenHash);

    void consumePasswordResetToken(UUID tokenId, Instant consumedAt);

    Set<UserRole> findRoles(UUID userId);
}
