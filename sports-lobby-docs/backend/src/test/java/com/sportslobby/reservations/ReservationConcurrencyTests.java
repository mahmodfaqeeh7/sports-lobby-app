package com.sportslobby.reservations;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.reservations.application.ReservationService;
import com.sportslobby.reservations.domain.Reservation;
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
import java.util.concurrent.atomic.AtomicLong;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@ActiveProfiles("test")
@SpringBootTest
@Testcontainers
class ReservationConcurrencyTests {
    private static final UUID SPORT_ID = UUID.fromString("10000000-0000-0000-0000-000000000001");
    private static final AtomicLong PHONE_SEQUENCE = new AtomicLong(790_100_000L);

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
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(11, 12, BigDecimal.valueOf(5), startsAt, startsAt.minusSeconds(43_200));
        List<AuthenticatedUser> contenders = seedPlayers(5, true, "ACTIVE");

        List<Result> results = joinConcurrently(lobby.id(), contenders);

        assertThat(results).containsExactlyInAnyOrder(
            Result.SUCCESS,
            Result.LOBBY_FULL,
            Result.LOBBY_FULL,
            Result.LOBBY_FULL,
            Result.LOBBY_FULL
        );
        assertCapacity(lobby.id(), 12);
    }

    @Test
    void concurrentDuplicateJoinCreatesOneReservationAndConsumesOneSeat() throws Exception {
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(0, 12, BigDecimal.valueOf(5), startsAt, startsAt.minusSeconds(43_200));
        AuthenticatedUser player = seedPlayer(true, "ACTIVE");

        List<Result> results = joinConcurrently(lobby.id(), List.of(player, player));

        assertThat(results).containsExactlyInAnyOrder(Result.SUCCESS, Result.ALREADY_RESERVED);
        assertCapacity(lobby.id(), 1);
    }

    @Test
    void retryAfterTakingFinalSeatIsAlreadyReservedNotLobbyFull() {
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(0, 1, BigDecimal.valueOf(5), startsAt, startsAt.minusSeconds(43_200));
        AuthenticatedUser player = seedPlayer(true, "ACTIVE");

        reservationService.join(lobby.id(), player);

        assertThatThrownBy(() -> reservationService.join(lobby.id(), player))
            .isInstanceOfSatisfying(ApiException.class, exception ->
                assertThat(exception.getCode()).isEqualTo(ApiErrorCode.ALREADY_RESERVED)
            );
        assertCapacity(lobby.id(), 1);
    }

    @Test
    void concurrentCancellationReleasesSeatExactlyOnce() throws Exception {
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(0, 12, BigDecimal.valueOf(5), startsAt, startsAt.minusSeconds(43_200));
        AuthenticatedUser player = seedPlayer(true, "ACTIVE");
        Reservation reservation = reservationService.join(lobby.id(), player);

        List<Reservation> results = runConcurrently(List.of(
            () -> reservationService.cancel(reservation.id(), player, "USER_REQUEST"),
            () -> reservationService.cancel(reservation.id(), player, "USER_REQUEST")
        ));

        assertThat(results).extracting(Reservation::status).containsOnly("CANCELLED");
        assertCapacity(lobby.id(), 0);
        Integer cancelledReservations = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM reservations WHERE id = ? AND status = 'CANCELLED'",
            Integer.class,
            reservation.id()
        );
        assertThat(cancelledReservations).isEqualTo(1);
    }

    @Test
    void cancellationAfterDeadlineDoesNotReleaseSeat() {
        Instant startsAt = Instant.now().plusSeconds(21_600);
        SeededLobby lobby = seedLobby(1, 12, BigDecimal.valueOf(5), startsAt, Instant.now().minusSeconds(60));
        SeededReservation seededReservation = lobby.reservations().get(0);

        assertThatThrownBy(() -> reservationService.cancel(
            seededReservation.id(),
            seededReservation.player(),
            "USER_REQUEST"
        )).isInstanceOfSatisfying(ApiException.class, exception ->
            assertThat(exception.getCode()).isEqualTo(ApiErrorCode.CANCELLATION_WINDOW_CLOSED)
        );
        assertCapacity(lobby.id(), 1);
    }

    @Test
    void reservationKeepsAuthoritativePriceSnapshot() {
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(0, 12, new BigDecimal("7.50"), startsAt, startsAt.minusSeconds(43_200));
        AuthenticatedUser player = seedPlayer(true, "ACTIVE");

        Reservation reservation = reservationService.join(lobby.id(), player);
        jdbcTemplate.update("UPDATE lobbies SET price_per_seat = 9.00 WHERE id = ?", lobby.id());

        BigDecimal snapshot = jdbcTemplate.queryForObject(
            "SELECT unit_price_snapshot FROM reservations WHERE id = ?",
            BigDecimal.class,
            reservation.id()
        );
        assertThat(snapshot).isEqualByComparingTo("7.50");
    }

    @Test
    void currentDatabaseAccountStatusOverridesStaleAccessTokenClaims() {
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(0, 12, BigDecimal.valueOf(5), startsAt, startsAt.minusSeconds(43_200));
        AuthenticatedUser restrictedPlayer = seedPlayer(true, "RESTRICTED");

        assertThatThrownBy(() -> reservationService.join(lobby.id(), restrictedPlayer))
            .isInstanceOfSatisfying(ApiException.class, exception ->
                assertThat(exception.getCode()).isEqualTo(ApiErrorCode.ACCOUNT_RESTRICTED)
            );
        assertCapacity(lobby.id(), 0);
    }

    @Test
    void currentDatabasePhoneVerificationOverridesStaleAccessTokenClaims() {
        Instant startsAt = Instant.now().plusSeconds(86_400);
        SeededLobby lobby = seedLobby(0, 12, BigDecimal.valueOf(5), startsAt, startsAt.minusSeconds(43_200));
        AuthenticatedUser player = seedPlayer(false, "ACTIVE");
        AuthenticatedUser staleToken = new AuthenticatedUser(player.userId(), player.roles(), true);

        assertThatThrownBy(() -> reservationService.join(lobby.id(), staleToken))
            .isInstanceOfSatisfying(ApiException.class, exception ->
                assertThat(exception.getCode()).isEqualTo(ApiErrorCode.FORBIDDEN)
            );
        assertCapacity(lobby.id(), 0);
    }

    private List<Result> joinConcurrently(UUID lobbyId, List<AuthenticatedUser> players) throws Exception {
        return runConcurrently(players.stream()
            .<Callable<Result>>map(player -> () -> {
                try {
                    reservationService.join(lobbyId, player);
                    return Result.SUCCESS;
                } catch (ApiException exception) {
                    return switch (exception.getCode()) {
                        case LOBBY_FULL -> Result.LOBBY_FULL;
                        case ALREADY_RESERVED -> Result.ALREADY_RESERVED;
                        default -> Result.OTHER_ERROR;
                    };
                }
            })
            .toList());
    }

    private <T> List<T> runConcurrently(List<Callable<T>> tasks) throws Exception {
        CountDownLatch ready = new CountDownLatch(tasks.size());
        CountDownLatch start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(tasks.size());
        try {
            var futures = tasks.stream()
                .map(task -> executor.submit(() -> {
                    ready.countDown();
                    start.await();
                    return task.call();
                }))
                .toList();
            ready.await();
            start.countDown();

            List<T> results = new ArrayList<>();
            for (var future : futures) {
                results.add(future.get());
            }
            return results;
        } finally {
            executor.shutdownNow();
        }
    }

    private SeededLobby seedLobby(
        int reservedSeats,
        int maxPlayers,
        BigDecimal pricePerSeat,
        Instant startsAt,
        Instant cancellationDeadline
    ) {
        AuthenticatedUser owner = seedUser(UserRole.VENDOR, true, "ACTIVE");
        UUID vendorId = UUID.randomUUID();
        UUID venueId = UUID.randomUUID();
        UUID courtId = UUID.randomUUID();
        UUID lobbyId = UUID.randomUUID();
        Instant now = Instant.now();
        jdbcTemplate.update(
            """
            INSERT INTO vendors (
                id, owner_user_id, business_name, contact_phone, contact_email,
                country_code, city, address_line, verification_status
            )
            VALUES (?, ?, 'Test Vendor', '+962790000000', ?, 'JO', 'Amman', 'Street', 'APPROVED')
            """,
            vendorId,
            owner.userId(),
            vendorId + "@example.com"
        );
        jdbcTemplate.update(
            """
            INSERT INTO venues (
                id, vendor_id, name, country_code, city, address_line,
                latitude, longitude, timezone, contact_phone, status
            )
            VALUES (?, ?, 'Venue', 'JO', 'Amman', 'Street', 31.950000, 35.910000, 'Asia/Amman', '+962790000000', 'ACTIVE')
            """,
            venueId,
            vendorId
        );
        jdbcTemplate.update(
            "INSERT INTO courts (id, venue_id, name, status, default_min_players, default_max_players) VALUES (?, ?, 'Court 1', 'ACTIVE', 1, ?)",
            courtId,
            venueId,
            maxPlayers
        );
        jdbcTemplate.update("INSERT INTO court_sports (court_id, sport_id) VALUES (?, ?)", courtId, SPORT_ID);
        jdbcTemplate.update(
            """
            INSERT INTO lobbies (
                id, vendor_id, venue_id, court_id, sport_id, status, starts_at, ends_at, venue_timezone_snapshot,
                min_players, max_players, reserved_seat_count, pricing_model, currency_code, price_per_seat,
                cancellation_deadline_at, confirmation_deadline_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Amman', 1, ?, ?, 'PRICE_PER_PLAYER', 'JOD', ?, ?, ?)
            """,
            lobbyId,
            vendorId,
            venueId,
            courtId,
            SPORT_ID,
            reservedSeats == maxPlayers ? "FULL" : "OPEN",
            Timestamp.from(startsAt),
            Timestamp.from(startsAt.plusSeconds(5_400)),
            maxPlayers,
            reservedSeats,
            pricePerSeat,
            Timestamp.from(cancellationDeadline),
            Timestamp.from(startsAt.minusSeconds(10_800))
        );

        List<SeededReservation> reservations = new ArrayList<>();
        for (int i = 0; i < reservedSeats; i++) {
            AuthenticatedUser player = seedPlayer(true, "ACTIVE");
            UUID reservationId = UUID.randomUUID();
            jdbcTemplate.update(
                """
                INSERT INTO reservations (
                    id, lobby_id, user_id, status, seat_count,
                    unit_price_snapshot, currency_code_snapshot, reserved_at
                )
                VALUES (?, ?, ?, 'RESERVED', 1, ?, 'JOD', ?)
                """,
                reservationId,
                lobbyId,
                player.userId(),
                pricePerSeat,
                Timestamp.from(now)
            );
            reservations.add(new SeededReservation(reservationId, player));
        }
        return new SeededLobby(lobbyId, List.copyOf(reservations));
    }

    private List<AuthenticatedUser> seedPlayers(int count, boolean phoneVerified, String status) {
        List<AuthenticatedUser> players = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            players.add(seedPlayer(phoneVerified, status));
        }
        return players;
    }

    private AuthenticatedUser seedPlayer(boolean phoneVerified, String status) {
        return seedUser(UserRole.PLAYER, phoneVerified, status);
    }

    private AuthenticatedUser seedUser(UserRole role, boolean phoneVerified, String status) {
        UUID userId = UUID.randomUUID();
        Timestamp verifiedAt = phoneVerified ? Timestamp.from(Instant.now()) : null;
        jdbcTemplate.update(
            """
            INSERT INTO users (
                id, first_name, last_name, email, phone_e164,
                phone_verified_at, password_hash, status
            )
            VALUES (?, 'Test', 'User', ?, ?, ?, 'hash', ?)
            """,
            userId,
            userId + "@example.com",
            "+962" + PHONE_SEQUENCE.getAndIncrement(),
            verifiedAt,
            status
        );
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role) VALUES (?, ?)", userId, role.name());
        return new AuthenticatedUser(userId, Set.of(role), phoneVerified);
    }

    private void assertCapacity(UUID lobbyId, int expected) {
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
        assertThat(activeReservations).isEqualTo(expected);
        assertThat(reservedSeatCount).isEqualTo(expected);
    }

    private record SeededLobby(UUID id, List<SeededReservation> reservations) {
    }

    private record SeededReservation(UUID id, AuthenticatedUser player) {
    }

    private enum Result {
        SUCCESS,
        LOBBY_FULL,
        ALREADY_RESERVED,
        OTHER_ERROR
    }
}
