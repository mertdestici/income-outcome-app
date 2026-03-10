package com.incomeoutcome.service;

import com.incomeoutcome.config.StorageConfig;
import com.incomeoutcome.dto.DocumentResponse;
import com.incomeoutcome.dto.OcrStatusResponse;
import com.incomeoutcome.entity.Document;
import com.incomeoutcome.entity.Expense;
import com.incomeoutcome.entity.OcrStatus;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.InvalidFileException;
import com.incomeoutcome.exception.ResourceNotFoundException;
import com.incomeoutcome.repository.DocumentRepository;
import com.incomeoutcome.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final ExpenseRepository expenseRepository;
    private final StorageConfig storageConfig;
    private final StorageService storageService;

    // ── Existing: upload linked to an existing expense ───────────────────────

    @Transactional
    public DocumentResponse upload(UUID expenseId, MultipartFile file, User user) throws IOException {
        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));

        validateFile(file);

        String storageKey = storageService.store(file, user.getId());
        Document document = Document.builder()
                .expense(expense)
                .user(user)
                .fileName(originalName(file, storageKey))
                .filePath(storageKey)
                .contentType(file.getContentType())
                .sizeBytes(file.getSize())
                .ocrStatus(OcrStatus.PENDING)
                .build();

        return toResponse(documentRepository.save(document));
    }

    // ── New: upload without expense — OCR flow ────────────────────────────────

    @Transactional
    public DocumentResponse uploadForOcr(MultipartFile file, User user) throws IOException {
        validateFile(file);

        String storageKey = storageService.store(file, user.getId());
        Document document = Document.builder()
                .user(user)
                .fileName(originalName(file, storageKey))
                .filePath(storageKey)
                .contentType(file.getContentType())
                .sizeBytes(file.getSize())
                .ocrStatus(OcrStatus.PENDING)
                .build();

        return toResponse(documentRepository.save(document));
        // OcrAsyncService.processDocument() is triggered by the controller after this commits
    }

    // ── New: link an orphaned document to an expense after OCR review ─────────

    @Transactional
    public void linkToExpense(UUID documentId, UUID expenseId, User user) {
        Document document = documentRepository.findByIdAndUser(documentId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        Expense expense = expenseRepository.findByIdAndUser(expenseId, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        document.setExpense(expense);
        documentRepository.save(document);
    }

    // ── New: OCR status polling ───────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OcrStatusResponse getOcrStatus(UUID id, User user) {
        Document doc = documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return new OcrStatusResponse(doc.getOcrStatus(), doc.getOcrVendor(),
                doc.getOcrDate(), doc.getOcrAmount());
    }

    // ── Existing: download / delete ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public Resource download(UUID id, User user) throws IOException {
        Document document = documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        return storageService.load(document.getFilePath());
    }

    @Transactional
    public void delete(UUID id, User user) throws IOException {
        Document document = documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        storageService.delete(document.getFilePath());
        documentRepository.delete(document);
    }

    public String getContentType(UUID id, User user) {
        return documentRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"))
                .getContentType();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void validateFile(MultipartFile file) {
        String contentType = file.getContentType();
        if (contentType == null || !storageConfig.getAllowedTypes().contains(contentType)) {
            throw new InvalidFileException("File type not allowed: " + contentType);
        }
        long maxBytes = (long) storageConfig.getMaxFileSizeMb() * 1024 * 1024;
        if (file.getSize() > maxBytes) {
            throw new InvalidFileException(
                    "File exceeds maximum size of " + storageConfig.getMaxFileSizeMb() + " MB");
        }
    }

    private String originalName(MultipartFile file, String fallback) {
        return file.getOriginalFilename() != null ? file.getOriginalFilename() : fallback;
    }

    private DocumentResponse toResponse(Document document) {
        return new DocumentResponse(
                document.getId(),
                document.getExpense() != null ? document.getExpense().getId() : null,
                document.getFileName(),
                document.getContentType(),
                document.getSizeBytes(),
                document.getUploadedAt(),
                document.getOcrStatus(),
                document.getOcrVendor(),
                document.getOcrDate(),
                document.getOcrAmount()
        );
    }
}
