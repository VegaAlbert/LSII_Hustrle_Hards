package com.tecnocampus.LS2.protube_back.controller.dto;

import java.time.LocalDate;

/**
 * Views of all my videos on one day (UTC), for the "views over time" chart of US-11.
 */
public record DailyViewsResponse(LocalDate date, long views) {
}
