package com.incomeoutcome.controller;

import com.incomeoutcome.dto.DocumentResponse;
import com.incomeoutcome.dto.OcrStatusResponse;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.service.DocumentService;
import com.incomeoutcome.service.OcrAsyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;
    private final OcrAsyncService ocrAsyncService;

    /**
     * Upload a document linked to an existing expense (backward-compatible flow).
     */
    @PostMapping("/upload")
    public ResponseEntity<DocumentResponse> upload(
            @RequestParam UUID expenseId,
            @RequestParam MultipartFile file
    ) throws IOException {
        DocumentResponse response = documentService.upload(expenseId, file, currentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Upload a document without an expense (OCR flow).
     * The expense is created separately on the OCR Review Screen.
     * Triggers async OCR after the document is committed.
     */
    @PostMapping("/upload/ocr")
    public ResponseEntity<DocumentResponse> uploadForOcr(
            @RequestParam MultipartFile file
    ) throws IOException {
        User user = currentUser();
        DocumentResponse response = documentService.uploadForOcr(file, user);
        ocrAsyncService.processDocument(response.id());  // fire-and-forget after commit
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Poll OCR processing status for a document.
     */
    @GetMapping("/{id}/ocr-status")
    public OcrStatusResponse getOcrStatus(@PathVariable UUID id) {
        return documentService.getOcrStatus(id, currentUser());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Resource> download(@PathVariable UUID id) throws IOException {
        User user = currentUser();
        Resource resource = documentService.download(id, user);
        String contentType = documentService.getContentType(id, user);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(contentType));
        headers.setContentDisposition(
                ContentDisposition.inline()
                        .filename(resource.getFilename() != null ? resource.getFilename() : id.toString())
                        .build()
        );

        return ResponseEntity.ok().headers(headers).body(resource);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) throws IOException {
        documentService.delete(id, currentUser());
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
