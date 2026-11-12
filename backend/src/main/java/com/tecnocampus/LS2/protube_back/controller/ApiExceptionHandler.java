package com.tecnocampus.LS2.protube_back.controller;

import com.tecnocampus.LS2.protube_back.controller.dto.ErrorResponse;
import com.tecnocampus.LS2.protube_back.services.InvalidCredentialsException;
import com.tecnocampus.LS2.protube_back.services.InvalidGoogleTokenException;
import com.tecnocampus.LS2.protube_back.services.InvalidUploadException;
import com.tecnocampus.LS2.protube_back.services.UserAlreadyExistsException;
import com.tecnocampus.LS2.protube_back.services.VideoAccessDeniedException;
import com.tecnocampus.LS2.protube_back.services.VideoNotFoundException;
import com.tecnocampus.LS2.protube_back.services.VideoStorageException;
import org.springframework.context.MessageSourceResolvable;
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
 * Turns exceptions thrown by the controllers into JSON errors the frontend can show next to each field.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException e) {
        Map<String, String> fieldErrors = e.getBindingResult().getFieldErrors().stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        error -> Objects.requireNonNullElse(error.getDefaultMessage(), "Invalid value"),
                        // Keep only the first message when a field breaks several rules
                        (first, second) -> first));

        return ResponseEntity.badRequest().body(new ErrorResponse("Invalid data", fieldErrors));
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
                                .orElse("Invalid value"),
                        (first, second) -> first));

        return ResponseEntity.badRequest().body(new ErrorResponse("Invalid parameters", fieldErrors));
    }

    // A @RequestParam that cannot be converted, e.g. GET /api/videos?page=abc
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("Invalid parameters", Map.of(e.getName(), "Invalid value")));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(HttpMessageNotReadableException e) {
        return ResponseEntity.badRequest().body(new ErrorResponse("Malformed request body"));
    }

    // A multipart request without one of its parts, e.g. an upload without the video file
    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException e) {
        String part = e.getRequestPartName();
        return ResponseEntity.badRequest()
                .body(new ErrorResponse("Invalid data", Map.of(part, "The " + part + " is required")));
    }

    @ExceptionHandler(InvalidUploadException.class)
    public ResponseEntity<ErrorResponse> handleInvalidUpload(InvalidUploadException e) {
        return ResponseEntity.badRequest()
                .body(new ErrorResponse(e.getMessage(), Map.of(e.getField(), e.getMessage())));
    }

    // Limits set by spring.servlet.multipart.* in application.properties
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadTooBig(MaxUploadSizeExceededException e) {
        String message = "The video must be at most 100 MB";
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ErrorResponse(message, Map.of("video", message)));
    }

    @ExceptionHandler(VideoAccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleVideoAccessDenied(VideoAccessDeniedException e) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(VideoStorageException.class)
    public ResponseEntity<ErrorResponse> handleVideoStorage(VideoStorageException e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(UserAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleUserAlreadyExists(UserAlreadyExistsException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(e.getMessage(), Map.of(e.getField(), e.getMessage())));
    }

    @ExceptionHandler(VideoNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleVideoNotFound(VideoNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(InvalidCredentialsException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
    }

    @ExceptionHandler(InvalidGoogleTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidGoogleToken(InvalidGoogleTokenException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse(e.getMessage()));
    }
}
