package com.incomeoutcome.exception;

/** Thrown for semantically invalid input that bean validation cannot express (HTTP 400). */
public class BadRequestException extends RuntimeException {
    public BadRequestException(String message) {
        super(message);
    }
}
