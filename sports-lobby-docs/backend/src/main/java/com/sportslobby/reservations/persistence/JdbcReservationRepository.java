package com.sportslobby.reservations.persistence;

import com.sportslobby.reservations.domain.Reservation;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcReservationRepository implements ReservationRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcReservationRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public boolean hasActiveReservation(UUID lobbyId, UUID userId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM reservations WHERE lobby_id = ? AND user_id = ? AND status IN ('RESERVED', 'CONFIRMED')",
            Integer.class,
            lobbyId,
            userId
        );
        return count != null && count > 0;
    }

    @Override
    public void create(Reservation reservation) {
        jdbcTemplate.update(
            """
            INSERT INTO reservations (
                id, lobby_id, user_id, status, seat_count, unit_price_snapshot, currency_code_snapshot,
                reserved_at, cancelled_at, cancellation_actor, cancellation_reason_code, attendance_status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            reservation.id(),
            reservation.lobbyId(),
            reservation.userId(),
            reservation.status(),
            reservation.seatCount(),
            reservation.unitPriceSnapshot(),
            reservation.currencyCodeSnapshot(),
            Timestamp.from(reservation.reservedAt()),
            toTimestamp(reservation.cancelledAt()),
            reservation.cancellationActor(),
            reservation.cancellationReasonCode(),
            reservation.attendanceStatus()
        );
    }

    @Override
    public Optional<Reservation> findById(UUID reservationId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(selectSql() + " WHERE id = ?", this::mapReservation, reservationId));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    @Override
    public List<Reservation> findByUserId(UUID userId) {
        return jdbcTemplate.query(selectSql() + " WHERE user_id = ? ORDER BY reserved_at DESC", this::mapReservation, userId);
    }

    @Override
    public boolean cancelActive(UUID reservationId, UUID userId, Instant cancelledAt, String actor, String reasonCode) {
        int updated = jdbcTemplate.update(
            """
            UPDATE reservations
            SET status = 'CANCELLED', cancelled_at = ?, cancellation_actor = ?, cancellation_reason_code = ?, updated_at = ?
            WHERE id = ? AND user_id = ? AND status IN ('RESERVED', 'CONFIRMED')
            """,
            Timestamp.from(cancelledAt),
            actor,
            reasonCode,
            Timestamp.from(cancelledAt),
            reservationId,
            userId
        );
        return updated == 1;
    }

    private String selectSql() {
        return """
            SELECT id, lobby_id, user_id, status, seat_count, unit_price_snapshot, currency_code_snapshot,
                   reserved_at, cancelled_at, cancellation_actor, cancellation_reason_code, attendance_status
            FROM reservations
            """;
    }

    private Reservation mapReservation(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new Reservation(
            rs.getObject("id", UUID.class),
            rs.getObject("lobby_id", UUID.class),
            rs.getObject("user_id", UUID.class),
            rs.getString("status"),
            rs.getInt("seat_count"),
            rs.getBigDecimal("unit_price_snapshot"),
            rs.getString("currency_code_snapshot"),
            rs.getTimestamp("reserved_at").toInstant(),
            rs.getTimestamp("cancelled_at") == null ? null : rs.getTimestamp("cancelled_at").toInstant(),
            rs.getString("cancellation_actor"),
            rs.getString("cancellation_reason_code"),
            rs.getString("attendance_status")
        );
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
