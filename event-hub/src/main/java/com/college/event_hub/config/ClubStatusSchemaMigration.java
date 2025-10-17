package com.college.event_hub.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures the {@code clubs.status} column exists for legacy databases that predate
 * the status-aware rollout. This avoids runtime SQL errors when older schemas are
 * missing the column but the application code now references it.
 */
@Component
public class ClubStatusSchemaMigration implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    public ClubStatusSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        addStatusColumnIfNeeded();
        backfillStatusValues();
        applyColumnConstraints();
    }

    private void addStatusColumnIfNeeded() {
        try {
            jdbcTemplate.execute("ALTER TABLE clubs ADD COLUMN status VARCHAR(20) DEFAULT 'ACTIVE' NOT NULL");
        } catch (DataAccessException ex) {
            if (!isColumnAlreadyExists(ex)) {
                throw ex;
            }
        }
    }

    private void backfillStatusValues() {
        try {
            jdbcTemplate.update("UPDATE clubs SET status = 'ACTIVE' WHERE status IS NULL");
        } catch (DataAccessException ex) {
            if (!isUndefinedColumn(ex)) {
                throw ex;
            }
        }
    }

    private void applyColumnConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE clubs ALTER COLUMN status SET DEFAULT 'ACTIVE'");
        } catch (DataAccessException ex) {
            if (!shouldIgnoreConstraintUpdate(ex)) {
                throw ex;
            }
        }

        try {
            jdbcTemplate.execute("ALTER TABLE clubs ALTER COLUMN status SET NOT NULL");
        } catch (DataAccessException ex) {
            if (!shouldIgnoreConstraintUpdate(ex)) {
                throw ex;
            }
        }
    }

    private boolean isColumnAlreadyExists(DataAccessException ex) {
        String message = extractMessage(ex);
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("already exists") || lower.contains("duplicate column");
    }

    private boolean isUndefinedColumn(DataAccessException ex) {
        String message = extractMessage(ex);
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("column") && (lower.contains("not found") || lower.contains("does not exist"));
    }

    private String extractMessage(DataAccessException ex) {
        Throwable root = ex.getMostSpecificCause();
        if (root == null) {
            root = ex;
        }
        return root.getMessage();
    }

    private boolean shouldIgnoreConstraintUpdate(DataAccessException ex) {
        String message = extractMessage(ex);
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("already") || lower.contains("does not exist") || lower.contains("not found") || lower.contains("duplicate column");
    }
}
