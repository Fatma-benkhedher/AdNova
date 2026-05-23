package com.example.makerskills.config;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Surfaces DB constraint messages instead of a bare 500, to simplify debugging from the browser.
 */
@RestControllerAdvice
public class RestExceptionHandler {

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> dataIntegrity(DataIntegrityViolationException ex) {
        Throwable root = ex.getMostSpecificCause();
        String detail = root.getMessage() != null ? root.getMessage() : ex.getMessage();
        Map<String, String> body = new LinkedHashMap<>();
        body.put("error", "Data constraint violation");
        body.put("detail", detail != null ? detail : "unknown");
        return ResponseEntity.status(409).body(body);
    }
}
