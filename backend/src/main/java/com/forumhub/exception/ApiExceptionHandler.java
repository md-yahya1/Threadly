package com.forumhub.exception;

import java.util.Map;
import java.util.NoSuchElementException;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(NoSuchElementException.class)
    ResponseEntity<?> missing(NoSuchElementException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    ResponseEntity<?> invalid(Exception e) {
        e.printStackTrace();

        return ResponseEntity.badRequest().body(Map.of(
                "message", e.getClass().getSimpleName(),
                "error", e.getMessage()
        ));
    }
}