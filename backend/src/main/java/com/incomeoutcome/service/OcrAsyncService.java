package com.incomeoutcome.service;

import com.incomeoutcome.entity.Document;
import com.incomeoutcome.entity.OcrStatus;
import com.incomeoutcome.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.File;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrAsyncService {

    private final DocumentRepository documentRepository;
    private final OcrService ocrService;
    private final StorageService storageService;
    private final TransactionTemplate transactionTemplate;

    @Async
    public void processDocument(UUID documentId) {
        // Step 1: mark PROCESSING so the polling endpoint can report it
        transactionTemplate.execute(status -> {
            documentRepository.findById(documentId).ifPresent(doc -> {
                doc.applyOcrResult(OcrStatus.PROCESSING, null, null, null);
                documentRepository.save(doc);
            });
            return null;
        });

        // Step 2: load file and run OCR (outside any transaction)
        OcrService.OcrResult result = null;
        boolean failed = false;

        try {
            Document doc = documentRepository.findById(documentId).orElse(null);
            if (doc == null) {
                log.warn("OCR job: document {} not found, skipping", documentId);
                return;
            }
            Resource resource = storageService.load(doc.getFilePath());
            File file = resource.getFile();
            result = ocrService.extract(file);
            log.info("OCR completed for document {}: vendor={}, date={}, amount={}",
                    documentId, result.vendor(), result.date(), result.amount());
        } catch (Exception e) {
            log.error("OCR failed for document {}: {}", documentId, e.getMessage());
            failed = true;
        }

        // Step 3: persist result
        final OcrService.OcrResult finalResult = result;
        final boolean finalFailed = failed;
        transactionTemplate.execute(status -> {
            documentRepository.findById(documentId).ifPresent(doc -> {
                if (finalFailed || finalResult == null) {
                    doc.applyOcrResult(OcrStatus.FAILED, null, null, null);
                } else {
                    doc.applyOcrResult(OcrStatus.DONE,
                            finalResult.vendor(), finalResult.date(), finalResult.amount());
                }
                documentRepository.save(doc);
            });
            return null;
        });
    }
}
