package com.sportslobby.lobbies.persistence;

import com.sportslobby.lobbies.domain.Lobby;
import com.sportslobby.lobbies.domain.LobbyDiscoveryItem;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcLobbyRepository implements LobbyRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcLobbyRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void create(Lobby lobby) {
        jdbcTemplate.update(
            """
            INSERT INTO lobbies (
                id, vendor_id, venue_id, court_id, sport_id, status, starts_at, ends_at, venue_timezone_snapshot,
                min_players, max_players, reserved_seat_count, pricing_model, currency_code, total_court_price,
                price_per_seat, description, cancellation_deadline_at, confirmation_deadline_at, published_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            lobby.id(),
            lobby.vendorId(),
            lobby.venueId(),
            lobby.courtId(),
            lobby.sportId(),
            lobby.status(),
            Timestamp.from(lobby.startsAt()),
            Timestamp.from(lobby.endsAt()),
            lobby.venueTimezoneSnapshot(),
            lobby.minPlayers(),
            lobby.maxPlayers(),
            lobby.reservedSeatCount(),
            lobby.pricingModel(),
            lobby.currencyCode(),
            lobby.totalCourtPrice(),
            lobby.pricePerSeat(),
            lobby.description(),
            Timestamp.from(lobby.cancellationDeadlineAt()),
            Timestamp.from(lobby.confirmationDeadlineAt()),
            toTimestamp(lobby.publishedAt())
        );
    }

    @Override
    public void updateDraft(Lobby lobby) {
        jdbcTemplate.update(
            """
            UPDATE lobbies
            SET venue_id = ?, court_id = ?, sport_id = ?, starts_at = ?, ends_at = ?, venue_timezone_snapshot = ?,
                min_players = ?, max_players = ?, pricing_model = ?, currency_code = ?, total_court_price = ?,
                price_per_seat = ?, description = ?, cancellation_deadline_at = ?, confirmation_deadline_at = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND status = 'DRAFT'
            """,
            lobby.venueId(),
            lobby.courtId(),
            lobby.sportId(),
            Timestamp.from(lobby.startsAt()),
            Timestamp.from(lobby.endsAt()),
            lobby.venueTimezoneSnapshot(),
            lobby.minPlayers(),
            lobby.maxPlayers(),
            lobby.pricingModel(),
            lobby.currencyCode(),
            lobby.totalCourtPrice(),
            lobby.pricePerSeat(),
            lobby.description(),
            Timestamp.from(lobby.cancellationDeadlineAt()),
            Timestamp.from(lobby.confirmationDeadlineAt()),
            lobby.id()
        );
    }

    @Override
    public Optional<Lobby> findById(UUID id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(selectSql() + " WHERE id = ?", this::mapLobby, id));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    @Override
    public List<Lobby> findByVendorId(UUID vendorId) {
        return jdbcTemplate.query(selectSql() + " WHERE vendor_id = ? ORDER BY starts_at DESC", this::mapLobby, vendorId);
    }

    @Override
    public List<LobbyDiscoveryItem> discover(UUID sportId, String city, String search, Instant from, Instant to) {
        StringBuilder sql = new StringBuilder(discoverySelectSql());
        sql.append(" WHERE lobbies.status IN ('OPEN', 'FULL', 'CONFIRMED') AND lobbies.starts_at >= CURRENT_TIMESTAMP ");
        java.util.ArrayList<Object> args = new java.util.ArrayList<>();
        if (sportId != null) {
            sql.append("AND lobbies.sport_id = ? ");
            args.add(sportId);
        }
        if (city != null && !city.isBlank()) {
            sql.append("AND LOWER(v.city) = LOWER(?) ");
            args.add(city.trim());
        }
        if (search != null && !search.isBlank()) {
            sql.append("AND (LOWER(v.name) LIKE LOWER(?) OR LOWER(v.area) LIKE LOWER(?) OR LOWER(c.name) LIKE LOWER(?)) ");
            String pattern = "%" + search.trim() + "%";
            args.add(pattern);
            args.add(pattern);
            args.add(pattern);
        }
        if (from != null) {
            sql.append("AND lobbies.starts_at >= ? ");
            args.add(Timestamp.from(from));
        }
        if (to != null) {
            sql.append("AND lobbies.starts_at <= ? ");
            args.add(Timestamp.from(to));
        }
        sql.append("ORDER BY lobbies.starts_at ASC LIMIT 50");
        return jdbcTemplate.query(sql.toString(), this::mapDiscoveryItem, args.toArray());
    }

    @Override
    public Optional<LobbyDiscoveryItem> findDiscoverableById(UUID lobbyId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                discoverySelectSql()
                    + " WHERE lobbies.id = ? AND lobbies.status IN ('OPEN', 'FULL', 'CONFIRMED')",
                this::mapDiscoveryItem,
                lobbyId
            ));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    @Override
    public boolean hasCourtOverlap(UUID courtId, Instant startsAt, Instant endsAt, UUID exceptLobbyId) {
        String sql = """
            SELECT COUNT(*)
            FROM lobbies
            WHERE court_id = ?
              AND status IN ('OPEN', 'FULL', 'CONFIRMED', 'IN_PROGRESS')
              AND starts_at < ?
              AND ends_at > ?
              AND (? IS NULL OR id <> ?)
            """;
        Integer count = jdbcTemplate.queryForObject(
            sql,
            Integer.class,
            courtId,
            Timestamp.from(endsAt),
            Timestamp.from(startsAt),
            exceptLobbyId,
            exceptLobbyId
        );
        return count != null && count > 0;
    }

    @Override
    public void publish(UUID lobbyId, Instant publishedAt) {
        jdbcTemplate.update(
            "UPDATE lobbies SET status = 'OPEN', published_at = ?, updated_at = ? WHERE id = ? AND status = 'DRAFT'",
            Timestamp.from(publishedAt),
            Timestamp.from(publishedAt),
            lobbyId
        );
    }

    @Override
    public boolean tryReserveSeat(UUID lobbyId) {
        int updated = jdbcTemplate.update(
            """
            UPDATE lobbies
            SET reserved_seat_count = reserved_seat_count + 1,
                status = CASE WHEN reserved_seat_count + 1 >= max_players THEN 'FULL' ELSE status END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
              AND status = 'OPEN'
              AND starts_at > CURRENT_TIMESTAMP
              AND reserved_seat_count < max_players
            """,
            lobbyId
        );
        return updated == 1;
    }

    @Override
    public void releaseSeat(UUID lobbyId) {
        jdbcTemplate.update(
            """
            UPDATE lobbies
            SET reserved_seat_count = reserved_seat_count - 1,
                status = CASE WHEN status = 'FULL' THEN 'OPEN' ELSE status END,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND reserved_seat_count > 0
            """,
            lobbyId
        );
    }

    private String selectSql() {
        return """
            SELECT lobbies.id, lobbies.vendor_id, lobbies.venue_id, lobbies.court_id, lobbies.sport_id,
                   lobbies.status, lobbies.starts_at, lobbies.ends_at, lobbies.venue_timezone_snapshot,
                   lobbies.min_players, lobbies.max_players, lobbies.reserved_seat_count, lobbies.pricing_model,
                   lobbies.currency_code, lobbies.total_court_price, lobbies.price_per_seat, lobbies.description,
                   lobbies.cancellation_deadline_at, lobbies.confirmation_deadline_at, lobbies.published_at
            FROM lobbies
            """;
    }

    private String discoverySelectSql() {
        return """
            SELECT lobbies.id, lobbies.vendor_id, lobbies.venue_id, lobbies.court_id, lobbies.sport_id,
                   lobbies.status, lobbies.starts_at, lobbies.ends_at, lobbies.venue_timezone_snapshot,
                   lobbies.min_players, lobbies.max_players, lobbies.reserved_seat_count, lobbies.pricing_model,
                   lobbies.currency_code, lobbies.total_court_price, lobbies.price_per_seat, lobbies.description,
                   lobbies.cancellation_deadline_at, lobbies.confirmation_deadline_at, lobbies.published_at,
                   v.name AS venue_name, v.city AS venue_city, v.area AS venue_area,
                   v.address_line AS venue_address, v.country_code AS venue_country_code,
                   v.latitude AS venue_latitude, v.longitude AS venue_longitude,
                   v.contact_phone AS venue_contact_phone,
                   c.name AS court_name, c.image_file_id AS court_image_file_id,
                   s.code AS sport_code, s.name AS sport_name
            FROM lobbies
            JOIN venues v ON v.id = lobbies.venue_id AND v.status = 'ACTIVE'
            JOIN courts c ON c.id = lobbies.court_id AND c.status = 'ACTIVE'
            JOIN sports s ON s.id = lobbies.sport_id AND s.is_active = TRUE
            """;
    }

    private LobbyDiscoveryItem mapDiscoveryItem(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new LobbyDiscoveryItem(
            mapLobby(rs, rowNum),
            rs.getString("venue_name"),
            rs.getString("venue_city"),
            rs.getString("venue_area"),
            rs.getString("venue_address"),
            rs.getString("venue_country_code"),
            rs.getBigDecimal("venue_latitude"),
            rs.getBigDecimal("venue_longitude"),
            rs.getString("venue_contact_phone"),
            rs.getString("court_name"),
            rs.getObject("court_image_file_id", UUID.class),
            rs.getString("sport_code"),
            rs.getString("sport_name")
        );
    }

    private Lobby mapLobby(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new Lobby(
            rs.getObject("id", UUID.class),
            rs.getObject("vendor_id", UUID.class),
            rs.getObject("venue_id", UUID.class),
            rs.getObject("court_id", UUID.class),
            rs.getObject("sport_id", UUID.class),
            rs.getString("status"),
            rs.getTimestamp("starts_at").toInstant(),
            rs.getTimestamp("ends_at").toInstant(),
            rs.getString("venue_timezone_snapshot"),
            rs.getInt("min_players"),
            rs.getInt("max_players"),
            rs.getInt("reserved_seat_count"),
            rs.getString("pricing_model"),
            rs.getString("currency_code"),
            rs.getBigDecimal("total_court_price"),
            rs.getBigDecimal("price_per_seat"),
            rs.getString("description"),
            rs.getTimestamp("cancellation_deadline_at").toInstant(),
            rs.getTimestamp("confirmation_deadline_at").toInstant(),
            rs.getTimestamp("published_at") == null ? null : rs.getTimestamp("published_at").toInstant()
        );
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant == null ? null : Timestamp.from(instant);
    }
}
