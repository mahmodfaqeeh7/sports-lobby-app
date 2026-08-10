package com.sportslobby.auth.persistence;

import com.sportslobby.auth.domain.OtpChallenge;
import com.sportslobby.auth.domain.OtpPurpose;
import com.sportslobby.auth.domain.PasswordResetToken;
import com.sportslobby.auth.domain.RefreshSession;
import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.auth.domain.UserStatus;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcAuthRepository implements AuthRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcAuthRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean emailExists(String email) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE LOWER(email) = LOWER(?)",
            Integer.class,
            email
        );
        return count != null && count > 0;
    }

    @Override
    public boolean phoneExists(String phoneE164) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE phone_e164 = ?",
            Integer.class,
            phoneE164
        );
        return count != null && count > 0;
    }

    @Override
    public void createUser(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        String phoneE164,
        String passwordHash
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO users (id, first_name, last_name, email, phone_e164, password_hash)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            userId,
            firstName,
            lastName,
            email,
            phoneE164,
            passwordHash
        );
    }

    @Override
    public void createPlayerUser(
        UUID userId,
        String firstName,
        String lastName,
        String email,
        String phoneE164,
        String passwordHash
    ) {
        createUser(userId, firstName, lastName, email, phoneE164, passwordHash);
    }

    @Override
    public void addRole(UUID userId, UserRole role) {
        jdbcTemplate.update(
            "INSERT INTO user_roles (user_id, role) VALUES (?, ?)",
            userId,
            role.name()
        );
    }

    @Override
    public void createPlayerProfile(UUID userId, String displayName) {
        jdbcTemplate.update(
            "INSERT INTO player_profiles (user_id, display_name) VALUES (?, ?)",
            userId,
            displayName
        );
    }

    @Override
    public Optional<UserAccount> findUserById(UUID userId) {
        return queryUser("WHERE u.id = ?", userId);
    }

    @Override
    public Optional<UserAccount> findUserByPhone(String phoneE164) {
        return queryUser("WHERE u.phone_e164 = ?", phoneE164);
    }

    @Override
    public void markPhoneVerified(String phoneE164, Instant verifiedAt) {
        jdbcTemplate.update(
            "UPDATE users SET phone_verified_at = ?, updated_at = ? WHERE phone_e164 = ?",
            Timestamp.from(verifiedAt),
            Timestamp.from(verifiedAt),
            phoneE164
        );
    }

    @Override
    public void updatePasswordHash(UUID userId, String passwordHash, Instant updatedAt) {
        jdbcTemplate.update(
            "UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?",
            passwordHash,
            Timestamp.from(updatedAt),
            userId
        );
    }

    @Override
    public Optional<OtpChallenge> findLatestOtpChallenge(String phoneE164, OtpPurpose purpose) {
        return queryOptional(
            """
            SELECT id, phone_e164, purpose, code_hash, expires_at, consumed_at, attempt_count, max_attempts,
                   resend_available_at, requested_by_user_id, created_at
            FROM otp_challenges
            WHERE phone_e164 = ? AND purpose = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            this::mapOtpChallenge,
            phoneE164,
            purpose.name()
        );
    }

    @Override
    public void createOtpChallenge(OtpChallenge challenge) {
        jdbcTemplate.update(
            """
            INSERT INTO otp_challenges (
                id, phone_e164, purpose, code_hash, expires_at, consumed_at, attempt_count, max_attempts,
                resend_available_at, requested_by_user_id, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            challenge.id(),
            challenge.phoneE164(),
            challenge.purpose().name(),
            challenge.codeHash(),
            Timestamp.from(challenge.expiresAt()),
            toTimestamp(challenge.consumedAt()),
            challenge.attemptCount(),
            challenge.maxAttempts(),
            Timestamp.from(challenge.resendAvailableAt()),
            challenge.requestedByUserId(),
            Timestamp.from(challenge.createdAt())
        );
    }

    @Override
    public void incrementOtpAttempts(UUID challengeId) {
        jdbcTemplate.update(
            "UPDATE otp_challenges SET attempt_count = attempt_count + 1 WHERE id = ?",
            challengeId
        );
    }

    @Override
    public void consumeOtpChallenges(String phoneE164, OtpPurpose purpose, Instant consumedAt) {
        jdbcTemplate.update(
            """
            UPDATE otp_challenges
            SET consumed_at = ?
            WHERE phone_e164 = ? AND purpose = ? AND consumed_at IS NULL
            """,
            Timestamp.from(consumedAt),
            phoneE164,
            purpose.name()
        );
    }

    @Override
    public void createRefreshSession(RefreshSession session) {
        jdbcTemplate.update(
            """
            INSERT INTO refresh_sessions (
                id, user_id, token_hash, device_label, expires_at, revoked_at,
                replaced_by_session_id, created_at, last_used_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            session.id(),
            session.userId(),
            session.tokenHash(),
            session.deviceLabel(),
            Timestamp.from(session.expiresAt()),
            toTimestamp(session.revokedAt()),
            session.replacedBySessionId(),
            Timestamp.from(session.createdAt()),
            toTimestamp(session.lastUsedAt())
        );
    }

    @Override
    public Optional<RefreshSession> findRefreshSessionByHash(String tokenHash) {
        return queryOptional(
            """
            SELECT id, user_id, token_hash, device_label, expires_at, revoked_at,
                   replaced_by_session_id, created_at, last_used_at
            FROM refresh_sessions
            WHERE token_hash = ?
            """,
            this::mapRefreshSession,
            tokenHash
        );
    }

    @Override
    public void revokeRefreshSession(UUID sessionId, Instant revokedAt, UUID replacedBySessionId) {
        jdbcTemplate.update(
            """
            UPDATE refresh_sessions
            SET revoked_at = ?, replaced_by_session_id = ?
            WHERE id = ? AND revoked_at IS NULL
            """,
            Timestamp.from(revokedAt),
            replacedBySessionId,
            sessionId
        );
    }

    @Override
    public void revokeAllRefreshSessions(UUID userId, Instant revokedAt) {
        jdbcTemplate.update(
            "UPDATE refresh_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
            Timestamp.from(revokedAt),
            userId
        );
    }

    @Override
    public void markRefreshSessionUsed(UUID sessionId, Instant usedAt) {
        jdbcTemplate.update(
            "UPDATE refresh_sessions SET last_used_at = ? WHERE id = ?",
            Timestamp.from(usedAt),
            sessionId
        );
    }

    @Override
    public void createPasswordResetToken(PasswordResetToken token) {
        jdbcTemplate.update(
            """
            INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, consumed_at, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            token.id(),
            token.userId(),
            token.tokenHash(),
            Timestamp.from(token.expiresAt()),
            toTimestamp(token.consumedAt()),
            Timestamp.from(token.createdAt())
        );
    }

    @Override
    public Optional<PasswordResetToken> findPasswordResetTokenByHash(String tokenHash) {
        return queryOptional(
            """
            SELECT id, user_id, token_hash, expires_at, consumed_at, created_at
            FROM password_reset_tokens
            WHERE token_hash = ?
            """,
            this::mapPasswordResetToken,
            tokenHash
        );
    }

    @Override
    public void consumePasswordResetToken(UUID tokenId, Instant consumedAt) {
        jdbcTemplate.update(
            "UPDATE password_reset_tokens SET consumed_at = ? WHERE id = ? AND consumed_at IS NULL",
            Timestamp.from(consumedAt),
            tokenId
        );
    }

    @Override
    public Set<UserRole> findRoles(UUID userId) {
        return jdbcTemplate.queryForList(
                "SELECT role FROM user_roles WHERE user_id = ?",
                String.class,
                userId
            )
            .stream()
            .map(UserRole::valueOf)
            .collect(Collectors.toUnmodifiableSet());
    }

    private Optional<UserAccount> queryUser(String whereClause, Object parameter) {
        return queryOptional(
            """
            SELECT u.id, u.first_name, u.last_name, u.email, u.phone_e164, u.phone_verified_at,
                   u.password_hash, u.status
            FROM users u
            """ + whereClause,
            (rs, rowNum) -> {
                UUID userId = rs.getObject("id", UUID.class);
                return new UserAccount(
                    userId,
                    rs.getString("first_name"),
                    rs.getString("last_name"),
                    rs.getString("email"),
                    rs.getString("phone_e164"),
                    toInstant(rs.getTimestamp("phone_verified_at")),
                    rs.getString("password_hash"),
                    UserStatus.valueOf(rs.getString("status")),
                    findRoles(userId)
                );
            },
            parameter
        );
    }

    private OtpChallenge mapOtpChallenge(ResultSet rs, int rowNum) throws SQLException {
        return new OtpChallenge(
            rs.getObject("id", UUID.class),
            rs.getString("phone_e164"),
            OtpPurpose.valueOf(rs.getString("purpose")),
            rs.getString("code_hash"),
            toInstant(rs.getTimestamp("expires_at")),
            toInstant(rs.getTimestamp("consumed_at")),
            rs.getInt("attempt_count"),
            rs.getInt("max_attempts"),
            toInstant(rs.getTimestamp("resend_available_at")),
            rs.getObject("requested_by_user_id", UUID.class),
            toInstant(rs.getTimestamp("created_at"))
        );
    }

    private RefreshSession mapRefreshSession(ResultSet rs, int rowNum) throws SQLException {
        return new RefreshSession(
            rs.getObject("id", UUID.class),
            rs.getObject("user_id", UUID.class),
            rs.getString("token_hash"),
            rs.getString("device_label"),
            toInstant(rs.getTimestamp("expires_at")),
            toInstant(rs.getTimestamp("revoked_at")),
            rs.getObject("replaced_by_session_id", UUID.class),
            toInstant(rs.getTimestamp("created_at")),
            toInstant(rs.getTimestamp("last_used_at"))
        );
    }

    private PasswordResetToken mapPasswordResetToken(ResultSet rs, int rowNum) throws SQLException {
        return new PasswordResetToken(
            rs.getObject("id", UUID.class),
            rs.getObject("user_id", UUID.class),
            rs.getString("token_hash"),
            toInstant(rs.getTimestamp("expires_at")),
            toInstant(rs.getTimestamp("consumed_at")),
            toInstant(rs.getTimestamp("created_at"))
        );
    }

    private <T> Optional<T> queryOptional(String sql, org.springframework.jdbc.core.RowMapper<T> mapper, Object... args) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(sql, mapper, args));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    private Instant toInstant(Timestamp timestamp) {
        return timestamp == null ? null : timestamp.toInstant();
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
