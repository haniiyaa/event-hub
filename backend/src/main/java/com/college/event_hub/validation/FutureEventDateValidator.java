package com.college.event_hub.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

public class FutureEventDateValidator implements ConstraintValidator<FutureEventDate, String> {

    private boolean allowPast;

    @Override
    public void initialize(FutureEventDate constraintAnnotation) {
        this.allowPast = constraintAnnotation.allowPast();
    }

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }

        String trimmed = value.trim();
        if (trimmed.isEmpty()) {
            return false;
        }

        try {
            LocalDateTime dateTime = LocalDateTime.parse(trimmed, DateTimeFormatter.ISO_DATE_TIME);
            if (allowPast) {
                return true;
            }
            return !dateTime.isBefore(LocalDateTime.now());
        } catch (DateTimeParseException ex) {
            return false;
        }
    }
}
