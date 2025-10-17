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
@Constraint(validatedBy = FutureEventDateValidator.class)
public @interface FutureEventDate {

    String message() default "Event date must be a valid ISO-8601 datetime in the future";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

    /**
     * Allows using the same annotation for partial updates where historical dates may be acceptable.
     */
    boolean allowPast() default false;
}
