package com.sportslobby.admin;

import static org.assertj.core.api.Assertions.assertThat;

import com.sportslobby.admin.application.AdminBootstrapProperties;
import com.sportslobby.admin.application.AdminBootstrapRunner;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseBuilder;
import org.springframework.jdbc.datasource.embedded.EmbeddedDatabaseType;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

class AdminBootstrapRunnerTests {

    @Test
    void createsVerifiedAdminAccountAndRole() throws Exception {
        DataSource dataSource = new EmbeddedDatabaseBuilder()
            .setType(EmbeddedDatabaseType.H2)
            .setName("admin_bootstrap;MODE=PostgreSQL;DATABASE_TO_UPPER=false")
            .build();
        new ResourceDatabasePopulator(new ClassPathResource("auth-test-schema.sql")).execute(dataSource);
        JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

        AdminBootstrapRunner runner = new AdminBootstrapRunner(
            jdbcTemplate,
            passwordEncoder,
            new AdminBootstrapProperties(
                true,
                "Admin",
                "User",
                "admin@sports-lobby.local",
                "+962799999999",
                "Admin123!"
            ),
            Clock.fixed(Instant.parse("2026-08-10T18:00:00Z"), ZoneOffset.UTC)
        );

        runner.run(new DefaultApplicationArguments());

        UUID userId = jdbcTemplate.queryForObject(
            "SELECT id FROM users WHERE phone_e164 = ? AND phone_verified_at IS NOT NULL",
            UUID.class,
            "+962799999999"
        );
        String passwordHash = jdbcTemplate.queryForObject("SELECT password_hash FROM users WHERE id = ?", String.class, userId);
        Integer adminRoleCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM user_roles WHERE user_id = ? AND role = 'ADMIN'",
            Integer.class,
            userId
        );

        assertThat(passwordEncoder.matches("Admin123!", passwordHash)).isTrue();
        assertThat(adminRoleCount).isEqualTo(1);
    }
}
