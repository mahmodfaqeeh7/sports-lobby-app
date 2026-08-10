package com.sportslobby.venues.persistence;

import com.sportslobby.venues.domain.Venue;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcVenueRepository implements VenueRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcVenueRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void create(Venue venue) {
        jdbcTemplate.update(
            """
            INSERT INTO venues (id, vendor_id, name, description, country_code, city, area, address_line,
                                latitude, longitude, timezone, contact_phone, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            venue.id(),
            venue.vendorId(),
            venue.name(),
            venue.description(),
            venue.countryCode(),
            venue.city(),
            venue.area(),
            venue.addressLine(),
            venue.latitude(),
            venue.longitude(),
            venue.timezone(),
            venue.contactPhone(),
            venue.status()
        );
    }

    @Override
    public List<Venue> findByVendorId(UUID vendorId) {
        return jdbcTemplate.query(selectSql() + " WHERE vendor_id = ? ORDER BY created_at DESC", this::mapVenue, vendorId);
    }

    @Override
    public Optional<Venue> findById(UUID venueId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(selectSql() + " WHERE id = ?", this::mapVenue, venueId));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    private String selectSql() {
        return """
            SELECT id, vendor_id, name, description, country_code, city, area, address_line,
                   latitude, longitude, timezone, contact_phone, status
            FROM venues
            """;
    }

    private Venue mapVenue(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        return new Venue(
            rs.getObject("id", UUID.class),
            rs.getObject("vendor_id", UUID.class),
            rs.getString("name"),
            rs.getString("description"),
            rs.getString("country_code"),
            rs.getString("city"),
            rs.getString("area"),
            rs.getString("address_line"),
            rs.getBigDecimal("latitude"),
            rs.getBigDecimal("longitude"),
            rs.getString("timezone"),
            rs.getString("contact_phone"),
            rs.getString("status")
        );
    }
}
