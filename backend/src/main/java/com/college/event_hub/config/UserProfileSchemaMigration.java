package com.college.event_hub.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Ensures legacy databases have the {@code users.class_details} column populated
 * so club admins can view attendee academic information captured during
 * registration.
 */
@Component
public class UserProfileSchemaMigration implements CommandLineRunner {

    private static final String DEFAULT_CLASS_DETAILS = "UNSPECIFIED";

    private final JdbcTemplate jdbcTemplate;

    public UserProfileSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        addClassDetailsColumnIfNeeded();
        backfillMissingClassDetails();
        applyColumnConstraints();
    }

    private void addClassDetailsColumnIfNeeded() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN class_details VARCHAR(100) DEFAULT '" + DEFAULT_CLASS_DETAILS + "'");
        } catch (DataAccessException ex) {
            if (!isColumnAlreadyExists(ex)) {
                throw ex;
            }
        }
    }

    private void backfillMissingClassDetails() {
        try {
            jdbcTemplate.update(
                "UPDATE users SET class_details = ? WHERE class_details IS NULL OR TRIM(class_details) = ''",
                DEFAULT_CLASS_DETAILS
            );
        } catch (DataAccessException ex) {
            if (!isUndefinedColumn(ex)) {
                throw ex;
            }
        }
    }

    private void applyColumnConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN class_details SET DEFAULT '" + DEFAULT_CLASS_DETAILS + "'");
        } catch (DataAccessException ex) {
            if (!shouldIgnoreConstraintUpdate(ex)) {
                throw ex;
            }
        }

        try {
            jdbcTemplate.execute("ALTER TABLE users ALTER COLUMN class_details SET NOT NULL");
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

    private boolean shouldIgnoreConstraintUpdate(DataAccessException ex) {
        String message = extractMessage(ex);
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("already") || lower.contains("does not exist") || lower.contains("not found") || lower.contains("duplicate column");
    }

    private String extractMessage(DataAccessException ex) {
        Throwable root = ex.getMostSpecificCause();
        if (root == null) {
            root = ex;
        }
        return root.getMessage();
    }
}
