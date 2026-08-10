package com.sportslobby.sports.persistence;

import com.sportslobby.sports.domain.Sport;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class JdbcSportRepository implements SportRepository {
    private final JdbcTemplate jdbcTemplate;

    public JdbcSportRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public List<Sport> findActive() {
        return jdbcTemplate.query(
            "SELECT id, code, name, is_active FROM sports WHERE is_active = TRUE ORDER BY name",
            (rs, rowNum) -> new Sport(rs.getObject("id", UUID.class), rs.getString("code"), rs.getString("name"), rs.getBoolean("is_active"))
        );
    }

    @Override
    public Optional<Sport> findActiveById(UUID id) {
        try {
            return Optional.ofNullable(jdbcTemplate.queryForObject(
                "SELECT id, code, name, is_active FROM sports WHERE id = ? AND is_active = TRUE",
                (rs, rowNum) -> new Sport(rs.getObject("id", UUID.class), rs.getString("code"), rs.getString("name"), rs.getBoolean("is_active")),
                id
            ));
        } catch (EmptyResultDataAccessException exception) {
            return Optional.empty();
        }
    }
}
