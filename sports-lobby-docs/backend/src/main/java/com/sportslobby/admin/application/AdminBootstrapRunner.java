package com.sportslobby.admin.application;

import com.sportslobby.auth.domain.UserRole;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(prefix = "app.admin.bootstrap", name = "enabled", havingValue = "true")
public class AdminBootstrapRunner implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;
    private final PasswordEncoder passwordEncoder;
    private final AdminBootstrapProperties properties;
    private final Clock clock;

    public AdminBootstrapRunner(
        JdbcTemplate jdbcTemplate,
        PasswordEncoder passwordEncoder,
        AdminBootstrapProperties properties,
        Clock clock
    ) {
        this.jdbcTemplate = jdbcTemplate;
        this.passwordEncoder = passwordEncoder;
        this.properties = properties;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Instant now = Instant.now(clock);
        UUID userId = findUserIdByPhoneOrEmail(properties.phoneE164(), properties.email());
        if (userId == null) {
            userId = UUID.randomUUID();
            jdbcTemplate.update(
                """
                INSERT INTO users (
                    id, first_name, last_name, email, phone_e164, phone_verified_at,
                    password_hash, status, created_at, updated_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
                """,
                userId,
                normalizeName(properties.firstName()),
                normalizeName(properties.lastName()),
                normalizeEmail(properties.email()),
                properties.phoneE164().trim(),
                Timestamp.from(now),
                passwordEncoder.encode(properties.password()),
                Timestamp.from(now),
                Timestamp.from(now)
            );
        } else {
            jdbcTemplate.update(
                """
                UPDATE users
                SET password_hash = ?, phone_verified_at = COALESCE(phone_verified_at, ?), updated_at = ?
                WHERE id = ?
                """,
                passwordEncoder.encode(properties.password()),
                Timestamp.from(now),
                Timestamp.from(now),
                userId
            );
        }

        if (!hasRole(userId, UserRole.ADMIN)) {
            jdbcTemplate.update(
                "INSERT INTO user_roles (user_id, role) VALUES (?, ?)",
                userId,
                UserRole.ADMIN.name()
            );
        }
    }

    private UUID findUserIdByPhoneOrEmail(String phoneE164, String email) {
        try {
            return jdbcTemplate.queryForObject(
                """
                SELECT id
                FROM users
                WHERE phone_e164 = ? OR LOWER(email) = LOWER(?)
                LIMIT 1
                """,
                UUID.class,
                phoneE164.trim(),
                normalizeEmail(email)
            );
        } catch (EmptyResultDataAccessException ignored) {
            return null;
        }
    }

    private boolean hasRole(UUID userId, UserRole role) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role = ?",
            Integer.class,
            userId,
            role.name()
        );
        return count != null && count > 0;
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizeName(String name) {
        return name.trim().replaceAll("\\s+", " ");
    }
}
