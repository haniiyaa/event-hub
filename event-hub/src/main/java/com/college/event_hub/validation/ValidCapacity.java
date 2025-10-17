package com.college.event_hub.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

import java.lang.annotation.Documented;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.ElementType.FIELD;
import static java.lang.annotation.ElementType.PARAMETER;
import static java.lang.annotation.RetentionPolicy.RUNTIME;

@Documented
@Target({FIELD, PARAMETER})
@Retention(RUNTIME)
@Constraint(validatedBy = ValidCapacityValidator.class)
public @interface ValidCapacity {

    String message() default "Capacity must be between {min} and {max}";

    int min() default 1;

    int max() default 10000;

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}
