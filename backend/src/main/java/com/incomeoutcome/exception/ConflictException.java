package com.incomeoutcome.exception;

/** Thrown when a request clashes with existing state (HTTP 409). */
public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
