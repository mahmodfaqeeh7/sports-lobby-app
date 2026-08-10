package com.sportslobby.reservations;

import static org.assertj.core.api.Assertions.assertThat;

import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.reservations.application.ReservationService;
import com.sportslobby.security.AuthenticatedUser;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@ActiveProfiles("test")
@SpringBootTest
@Testcontainers
class ReservationConcurrencyTests {
    private static final UUID SPORT_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void databaseProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
        registry.add("spring.flyway.enabled", () -> "true");
    }

    private final ReservationService reservationService;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    ReservationConcurrencyTests(ReservationService reservationService, JdbcTemplate jdbcTemplate) {
        this.reservationService = reservationService;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Test
    void exactlyOneConcurrentRequestGetsFinalSeat() throws Exception {
        UUID lobbyId = seedLobbyWithElevenReservedSeats();
        List<AuthenticatedUser> contenders = seedContenders(5);
        CountDownLatch ready = new CountDownLatch(contenders.size());
        CountDownLatch start = new CountDownLatch(1);

        var executor = Executors.newFixedThreadPool(contenders.size());
        try {
            List<Callable<Result>> tasks = contenders.stream()
                .<Callable<Result>>map(user -> () -> {
                    ready.countDown();
                    start.await();
                    try {
                        reservationService.join(lobbyId, user);
                        return Result.SUCCESS;
                    } catch (ApiException exception) {
                        if (exception.getCode() == ApiErrorCode.LOBBY_FULL) {
                            return Result.LOBBY_FULL;
                        }
                        return Result.OTHER_ERROR;
                    }
                })
                .toList();

            List<java.util.concurrent.Future<Result>> futures = new ArrayList<>();
            tasks.forEach(task -> futures.add(executor.submit(task)));
            ready.await();
            start.countDown();

            List<Result> results = new ArrayList<>();
            for (var future : futures) {
                results.add(future.get());
            }

            assertThat(results).containsExactlyInAnyOrder(
                Result.SUCCESS,
                Result.LOBBY_FULL,
                Result.LOBBY_FULL,
                Result.LOBBY_FULL,
                Result.LOBBY_FULL
            );
            Integer activeReservations = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM reservations WHERE lobby_id = ? AND status IN ('RESERVED', 'CONFIRMED')",
                Integer.class,
                lobbyId
            );
            Integer reservedSeatCount = jdbcTemplate.queryForObject(
                "SELECT reserved_seat_count FROM lobbies WHERE id = ?",
                Integer.class,
                lobbyId
            );
            assertThat(activeReservations).isEqualTo(12);
            assertThat(reservedSeatCount).isEqualTo(12);
        } finally {
            executor.shutdownNow();
        }
    }

    private UUID seedLobbyWithElevenReservedSeats() {
        UUID ownerId = UUID.randomUUID();
        UUID vendorId = UUID.randomUUID();
        UUID venueId = UUID.randomUUID();
        UUID courtId = UUID.randomUUID();
        UUID lobbyId = UUID.randomUUID();
        Instant now = Instant.now();
        Instant startsAt = now.plusSeconds(86_400);
        jdbcTemplate.update(
            "INSERT INTO users (id, first_name, last_name, email, phone_e164, phone_verified_at, password_hash) VALUES (?, 'Owner', 'User', ?, ?, ?, 'hash')",
            ownerId,
            ownerId + "@example.com",
            "+962779999999",
            Timestamp.from(now)
        );
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'VENDOR')", ownerId);
        jdbcTemplate.update(
            """
            INSERT INTO vendors (id, owner_user_id, business_name, contact_phone, contact_email, country_code, city, address_line, verification_status)
            VALUES (?, ?, 'Test Vendor', '+962790000000', 'vendor@example.com', 'JO', 'Amman', 'Street', 'APPROVED')
            """,
            vendorId,
            ownerId
        );
        jdbcTemplate.update(
            """
            INSERT INTO venues (id, vendor_id, name, country_code, city, address_line, latitude, longitude, timezone, contact_phone, status)
            VALUES (?, ?, 'Venue', 'JO', 'Amman', 'Street', 31.950000, 35.910000, 'Asia/Amman', '+962790000000', 'ACTIVE')
            """,
            venueId,
            vendorId
        );
        jdbcTemplate.update(
            "INSERT INTO courts (id, venue_id, name, status, default_min_players, default_max_players) VALUES (?, ?, 'Court 1', 'ACTIVE', 8, 12)",
            courtId,
            venueId
        );
        jdbcTemplate.update("INSERT INTO court_sports (court_id, sport_id) VALUES (?, ?)", courtId, SPORT_ID);
        jdbcTemplate.update(
            """
            INSERT INTO lobbies (
                id, vendor_id, venue_id, court_id, sport_id, status, starts_at, ends_at, venue_timezone_snapshot,
                min_players, max_players, reserved_seat_count, pricing_model, currency_code, price_per_seat,
                cancellation_deadline_at, confirmation_deadline_at
            )
            VALUES (?, ?, ?, ?, ?, 'OPEN', ?, ?, 'Asia/Amman', 8, 12, 11, 'PRICE_PER_PLAYER', 'JOD', ?, ?, ?)
            """,
            lobbyId,
            vendorId,
            venueId,
            courtId,
            SPORT_ID,
            Timestamp.from(startsAt),
            Timestamp.from(startsAt.plusSeconds(5400)),
            BigDecimal.valueOf(5),
            Timestamp.from(startsAt.minusSeconds(43_200)),
            Timestamp.from(startsAt.minusSeconds(10_800))
        );
        for (int i = 0; i < 11; i++) {
            UUID playerId = seedPlayer("+96279" + String.format("%07d", i), "seed" + i + "@example.com");
            jdbcTemplate.update(
                """
                INSERT INTO reservations (id, lobby_id, user_id, status, seat_count, unit_price_snapshot, currency_code_snapshot, reserved_at)
                VALUES (?, ?, ?, 'RESERVED', 1, 5.00, 'JOD', ?)
                """,
                UUID.randomUUID(),
                lobbyId,
                playerId,
                Timestamp.from(now)
            );
        }
        return lobbyId;
    }

    private List<AuthenticatedUser> seedContenders(int count) {
        List<AuthenticatedUser> users = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            UUID userId = seedPlayer("+96278" + String.format("%07d", i), "contender" + i + "@example.com");
            users.add(new AuthenticatedUser(userId, Set.of(UserRole.PLAYER), true));
        }
        return users;
    }

    private UUID seedPlayer(String phone, String email) {
        UUID userId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO users (id, first_name, last_name, email, phone_e164, phone_verified_at, password_hash) VALUES (?, 'Player', 'User', ?, ?, ?, 'hash')",
            userId,
            email,
            phone,
            Timestamp.from(Instant.now())
        );
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'PLAYER')", userId);
        return userId;
    }

    enum Result {
        SUCCESS,
        LOBBY_FULL,
        OTHER_ERROR
    }
}
