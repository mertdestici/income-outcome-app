package com.incomeoutcome.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id")   // nullable — set after OCR review
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "content_type", nullable = false, length = 127)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "uploaded_at", nullable = false, updatable = false)
    private Instant uploadedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "ocr_status", nullable = false, length = 20)
    @Builder.Default
    private OcrStatus ocrStatus = OcrStatus.PENDING;

    @Column(name = "ocr_vendor")
    private String ocrVendor;

    @Column(name = "ocr_date")
    private LocalDate ocrDate;

    @Column(name = "ocr_amount", precision = 19, scale = 4)
    private BigDecimal ocrAmount;

    @PrePersist
    private void prePersist() {
        if (uploadedAt == null) uploadedAt = Instant.now();
        if (ocrStatus == null) ocrStatus = OcrStatus.PENDING;
    }

    public void applyOcrResult(OcrStatus status, String vendor, LocalDate date, BigDecimal amount) {
        this.ocrStatus = status;
        this.ocrVendor = vendor;
        this.ocrDate   = date;
        this.ocrAmount = amount;
    }

    public void setExpense(Expense expense) {
        this.expense = expense;
    }
}
