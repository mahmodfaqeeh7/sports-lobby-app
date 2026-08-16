package com.sportslobby.courts.persistence;

import com.sportslobby.courts.domain.Court;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcCourtRepository implements CourtRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcCourtRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void create(Court court) {
        jdbcTemplate.update(
            """
            INSERT INTO courts (
                id, venue_id, name, description, status, default_min_players, default_max_players, image_file_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            court.id(),
            court.venueId(),
            court.name(),
            court.description(),
            court.status(),
            court.defaultMinPlayers(),
            court.defaultMaxPlayers(),
            court.imageFileId()
        );
        court.sportIds().forEach(sportId -> jdbcTemplate.update(
            "INSERT INTO court_sports (court_id, sport_id) VALUES (?, ?)",
            court.id(),
            sportId
        ));
    }

    @Override
    public List<Court> findByVenueId(UUID venueId) {
        return jdbcTemplate.query(selectSql() + " WHERE venue_id = ? ORDER BY created_at DESC", this::mapCourt, venueId);
    }

    @Override
    public Optional<Court> findById(UUID courtId) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(selectSql() + " WHERE id = ?", this::mapCourt, courtId));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }

    @Override
    public boolean supportsSport(UUID courtId, UUID sportId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM court_sports WHERE court_id = ? AND sport_id = ?",
            Integer.class,
            courtId,
            sportId
        );
        return count != null && count > 0;
    }

    @Override
    public boolean isImageInUse(UUID imageFileId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM courts WHERE image_file_id = ?",
            Integer.class,
            imageFileId
        );
        return count != null && count > 0;
    }

    private String selectSql() {
        return """
            SELECT id, venue_id, name, description, status, default_min_players, default_max_players, image_file_id
            FROM courts
            """;
    }

    private Court mapCourt(java.sql.ResultSet rs, int rowNum) throws java.sql.SQLException {
        UUID courtId = rs.getObject("id", UUID.class);
        List<UUID> sportIds = jdbcTemplate.queryForList(
            "SELECT sport_id FROM court_sports WHERE court_id = ? ORDER BY created_at",
            UUID.class,
            courtId
        );
        return new Court(
            courtId,
            rs.getObject("venue_id", UUID.class),
            rs.getString("name"),
            rs.getString("description"),
            rs.getString("status"),
            (Integer) rs.getObject("default_min_players"),
            (Integer) rs.getObject("default_max_players"),
            rs.getObject("image_file_id", UUID.class),
            sportIds
        );
    }
}
