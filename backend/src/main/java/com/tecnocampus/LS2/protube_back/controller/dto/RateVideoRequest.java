package com.tecnocampus.LS2.protube_back.controller.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

/**
 * Body of PUT /api/videos/{id}/rating: a whole number of stars from 1 to 5. Read as a decimal on purpose, so a
 * manipulated value such as 4.5 is rejected with a message instead of being silently truncated to 4.
 */
public record RateVideoRequest(
        @NotNull(message = "Score is required")
        @DecimalMin(value = "1", message = "Score must be between 1 and 5")
        @DecimalMax(value = "5", message = "Score must be between 1 and 5")
        @Digits(integer = 1, fraction = 0, message = "Score must be a whole number of stars")
        BigDecimal score) {
}
