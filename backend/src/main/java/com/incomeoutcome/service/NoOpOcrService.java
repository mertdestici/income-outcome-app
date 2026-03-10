package com.incomeoutcome.service;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.File;

/**
 * No-op OCR implementation — returns null suggestions.
 * Active when app.ocr.provider=none (the default).
 * Switch to a real provider by setting app.ocr.provider=tesseract|google|aws
 * and registering the corresponding @ConditionalOnProperty implementation.
 */
@Service
@ConditionalOnProperty(name = "app.ocr.provider", havingValue = "none", matchIfMissing = true)
public class NoOpOcrService implements OcrService {

    @Override
    public OcrResult extract(File imageFile) {
        return new OcrResult(null, null, null);
    }
}
