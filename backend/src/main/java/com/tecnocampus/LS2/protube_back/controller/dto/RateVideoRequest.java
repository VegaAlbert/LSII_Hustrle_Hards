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
        @NotNull(message = "{validation.score.required}")
        @DecimalMin(value = "1", message = "{validation.score.range}")
        @DecimalMax(value = "5", message = "{validation.score.range}")
        @Digits(integer = 1, fraction = 0, message = "{validation.score.whole}")
        BigDecimal score) {
}
