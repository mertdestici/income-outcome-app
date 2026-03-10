package com.incomeoutcome.service;

import java.io.File;
import java.math.BigDecimal;
import java.time.LocalDate;

public interface OcrService {

    record OcrResult(String vendor, LocalDate date, BigDecimal amount) {}

    /**
     * Extract vendor, date, and amount from a receipt or invoice image.
     * Returns an OcrResult with null fields if extraction fails or is unsupported.
     */
    OcrResult extract(File imageFile);
}
