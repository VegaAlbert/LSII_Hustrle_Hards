package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.ErrorResponse;
import com.tecnocampus.LS2.protube_back.services.RatingConflictException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.Locale;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Cases of ApiExceptionHandler that are hard to reach through a real request: concurrent ratings and a field that
 * breaks several rules at once.
 */
class ApiExceptionHandlerTest {

    private final ApiExceptionHandler handler = new ApiExceptionHandler(englishMessages());

    // The real messages*.properties bundle, read in English as the default locale of the API
    private static ResourceBundleMessageSource englishMessages() {
        ResourceBundleMessageSource messages = new ResourceBundleMessageSource();
        messages.setBasename("messages");
        messages.setDefaultEncoding("UTF-8");
        messages.setFallbackToSystemLocale(false);
        return messages;
    }

    @BeforeEach
    void readTheMessagesInEnglish() {
        LocaleContextHolder.setLocale(Locale.ENGLISH);
    }

    @AfterEach
    void resetTheLocale() {
        LocaleContextHolder.resetLocaleContext();
    }

    @Test
    void aRatingConflictIsA409WithItsMessage() {
        ResponseEntity<ErrorResponse> response = handler.handleRatingConflict(new RatingConflictException(7L));

        assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
        assertEquals("Your rating of video 7 was changed at the same time. Please try again",
                response.getBody().message());
    }

    @Test
    void aFieldThatBreaksSeveralRulesKeepsOnlyTheFirstMessage() throws NoSuchMethodException {
        BeanPropertyBindingResult result = new BeanPropertyBindingResult(new Object(), "request");
        result.addError(new FieldError("request", "username", "Username is required"));
        result.addError(new FieldError("request", "username", "Username must be between 3 and 30 characters"));
        result.addError(new FieldError("request", "password", null, false, null, null, null));
        MethodParameter parameter = new MethodParameter(
                ApiExceptionHandlerTest.class.getDeclaredMethod("endpoint", Object.class), 0);

        ResponseEntity<ErrorResponse> response =
                handler.handleValidation(new MethodArgumentNotValidException(parameter, result));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        assertEquals(Map.of("username", "Username is required", "password", "Invalid value"),
                response.getBody().fieldErrors());
    }

    @SuppressWarnings("unused")
    private void endpoint(Object request) {
        // Only used as the MethodParameter of the validation exception
    }
}
