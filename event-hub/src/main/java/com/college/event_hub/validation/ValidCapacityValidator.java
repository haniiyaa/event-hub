package com.college.event_hub.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class ValidCapacityValidator implements ConstraintValidator<ValidCapacity, Integer> {

    private int min;
    private int max;

    @Override
    public void initialize(ValidCapacity constraintAnnotation) {
        this.min = constraintAnnotation.min();
        this.max = constraintAnnotation.max();
    }

    @Override
    public boolean isValid(Integer value, ConstraintValidatorContext context) {
        if (value == null) {
            return true;
        }
        return value >= min && value <= max;
    }
}
