package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.ErrorResponse;
import com.tecnocampus.LS2.protube_back.services.ChannelNotFoundException;
import com.tecnocampus.LS2.protube_back.services.CommentNotFoundException;
import com.tecnocampus.LS2.protube_back.services.InvalidCredentialsException;
import com.tecnocampus.LS2.protube_back.services.InvalidGoogleTokenException;
import com.tecnocampus.LS2.protube_back.services.InvalidSubscriptionException;
import com.tecnocampus.LS2.protube_back.services.InvalidUploadException;
import com.tecnocampus.LS2.protube_back.services.LocalizedException;
import com.tecnocampus.LS2.protube_back.services.RatingConflictException;
import com.tecnocampus.LS2.protube_back.services.UserAlreadyExistsException;
import com.tecnocampus.LS2.protube_back.services.VideoAccessDeniedException;
import com.tecnocampus.LS2.protube_back.services.VideoNotFoundException;
import com.tecnocampus.LS2.protube_back.services.VideoStorageException;
import org.springframework.context.MessageSource;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Turns exceptions thrown by the controllers into JSON errors the frontend can show next to each field. Messages are
 * in the language of the request (Accept-Language, see LocaleConfig), read from messages*.properties.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private final MessageSource messageSource;

    public ApiExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    private String text(String key, Object... args) {
        return messageSource.getMessage(key, args, LocaleContextHolder.getLocale());
    }

    // The English message of the exception is the fallback if its key is missing
    private String text(LocalizedException e) {
        return messageSource.getMessage(e.getMessageKey(), e.getMessageArgs(), e.getMessage(),
                LocaleContextHolder.getLocale());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> Objects.requireNonNullElse(error.getDefaultMessage(), text("error.invalidValue")),
                        // Keep only the first message when a field breaks several rules
                        (first, second) -> first));

        return ResponseEntity.badRequest().body(new ErrorResponse(text("error.invalidData"), fieldErrors));
    }

    // Constraints on @RequestParam values, e.g. GET /api/videos?size=100
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleParameterValidation(HandlerMethodValidationException e) {
        Map<String, String> fieldErrors = e.getAllValidationResults().stream()
                .collect(Collectors.toMap(
                        result -> Objects.requireNonNullElse(result.getMethodParameter().getParameterName(), "parameter"),
                        result -> result.getResolvableErrors().stream()
                                .map(MessageSourceResolvable::getDefaultMessage)
                                .filter(Objects::nonNull)
                                .findFirst()
                                .orElseGet(() -> text("error.invalidValue")),
                        (first, second) -> first));

        return ResponseEntity.badRequest().body(new ErrorResponse(text("error.invalidParameters"), fieldErrors));
    }

    // A @RequestParam that cannot be converted, e.g. GET /api/videos?page=abc
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(text("error.invalidParameters"),
                        Map.of(e.getName(), text("error.invalidValue"))));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(text("error.malformedBody")));
    }

    // A multipart request without one of its parts, e.g. an upload without the video file
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException e) {
        String part = e.getRequestPartName();
        // A message for each known part ("The video is required"), or a generic one with the name of the part
        String message = messageSource.getMessage("error.part.required." + part, null,
                text("error.part.required", part), LocaleContextHolder.getLocale());
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(text("error.invalidData"), Map.of(part, message)));
    }

    @ExceptionHandler(InvalidUploadException.class)
    public ResponseEntity<ErrorResponse> handleInvalidUpload(InvalidUploadException e) {
        String message = text(e);
        return ResponseEntity.badRequest().body(new ErrorResponse(message, Map.of(e.getField(), message)));
    }

    // Limits set by spring.servlet.multipart.* in application.properties
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadTooBig(MaxUploadSizeExceededException e) {
        String message = text("error.upload.tooBig");
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponse(message, Map.of("video", message)));
    }

    @ExceptionHandler(VideoAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleVideoAccessDenied(VideoAccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(VideoStorageException.class)
    public ResponseEntity<ErrorResponse> handleVideoStorage(VideoStorageException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(UserAlreadyExistsException e) {
        String message = text(e);
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(message, Map.of(e.getField(), message)));
    }

    @ExceptionHandler(RatingConflictException.class)
    public ResponseEntity<ErrorResponse> handleRatingConflict(RatingConflictException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(VideoNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleVideoNotFound(VideoNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(CommentNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCommentNotFound(CommentNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(ChannelNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleChannelNotFound(ChannelNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(InvalidSubscriptionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidSubscription(InvalidSubscriptionException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(text(e)));
    }

    @ExceptionHandler(InvalidGoogleTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidGoogleToken(InvalidGoogleTokenException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(text(e)));
    }
}
