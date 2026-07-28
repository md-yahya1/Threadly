package com.forumhub.exception;

import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<?> missing(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidationExceptions(MethodArgumentNotValidException e) {
        Map<String, String> errors = new HashMap<>();
        e.getBindingResult().getFieldErrors().forEach(error ->
                errors.put(error.getField(), error.getDefaultMessage())
        );

        String firstMessage = e.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getDefaultMessage())
                .findFirst()
                .orElse("Validation failed");

        return ResponseEntity.badRequest().body(Map.of(
                "message", firstMessage,
                "errors", errors
        ));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> invalid(Exception e) {
        e.printStackTrace();

        return ResponseEntity.badRequest().body(Map.of(
                "message", e.getClass().getSimpleName(),
                "error", e.getMessage() != null ? e.getMessage() : "An unexpected error occurred"
        ));
    }
}