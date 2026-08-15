package com.sportslobby.common.web;

import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiErrorResponse;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.security.RateLimitExceededException;
import jakarta.validation.ConstraintViolationException;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RateLimitExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleRateLimit(RateLimitExceededException exception) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
            .header(HttpHeaders.RETRY_AFTER, Long.toString(exception.retryAfterSeconds()))
            .body(error(
                ApiErrorCode.RATE_LIMITED,
                exception.getMessage(),
                Map.of("retryAfterSeconds", exception.retryAfterSeconds())
            ));
    }

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiErrorResponse> handleApiException(ApiException exception) {
        return ResponseEntity.status(exception.getStatus()).body(
            error(exception.getCode(), exception.getMessage(), Map.of())
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        Map<String, Object> fields = new LinkedHashMap<>();
        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            fields.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return ResponseEntity.badRequest().body(
            error(ApiErrorCode.VALIDATION_ERROR, "Request validation failed.", Map.of("fields", fields))
        );
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiErrorResponse> handleConstraintViolation(ConstraintViolationException exception) {
        Map<String, Object> violations = new LinkedHashMap<>();
        exception.getConstraintViolations().forEach(violation ->
            violations.put(violation.getPropertyPath().toString(), violation.getMessage())
        );

        return ResponseEntity.badRequest().body(
            error(ApiErrorCode.VALIDATION_ERROR, "Request validation failed.", Map.of("violations", violations))
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleUnexpected(Exception exception) {
        log.error("Unhandled API exception", exception);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            error(ApiErrorCode.INTERNAL_ERROR, "An unexpected error occurred.", Map.of())
        );
    }

    private ApiErrorResponse error(ApiErrorCode code, String message, Map<String, Object> details) {
        return ApiErrorResponse.of(code, message, MDC.get(RequestIdFilter.MDC_KEY), details);
    }
}
