package com.incomeoutcome.service;

import com.incomeoutcome.entity.Document;
import com.incomeoutcome.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.multipdf.PDFMergerUtility;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PdfReportService {

    private final StorageService storageService;

    /**
     * Builds a single PDF containing all documents for the given user/month.
     * Images are embedded as full-page A4 images; PDFs are merged page-by-page.
     * Returns null if documents list is empty.
     */
    public byte[] generateMonthlyReport(User user, List<Document> documents, int year, int month)
            throws IOException {
        if (documents.isEmpty()) return null;

        try (PDDocument output = new PDDocument()) {
            for (Document doc : documents) {
                try {
                    Resource resource = storageService.load(doc.getFilePath());
                    if (doc.getContentType().startsWith("image/")) {
                        appendImagePage(output, resource);
                    } else if ("application/pdf".equals(doc.getContentType())) {
                        mergePdf(output, resource);
                    }
                } catch (Exception e) {
                    log.warn("Skipping document {} in monthly report: {}", doc.getId(), e.getMessage());
                }
            }

            if (output.getNumberOfPages() == 0) return null;

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            output.save(baos);
            return baos.toByteArray();
        }
    }

    private void appendImagePage(PDDocument doc, Resource resource) throws IOException {
        PDPage page = new PDPage(PDRectangle.A4);
        doc.addPage(page);
        PDImageXObject image = PDImageXObject.createFromByteArray(doc,
                resource.getContentAsByteArray(), "img");
        try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
            float pageW = page.getMediaBox().getWidth();
            float pageH = page.getMediaBox().getHeight();
            float scale = Math.min(pageW / image.getWidth(), pageH / image.getHeight());
            float w = image.getWidth() * scale;
            float h = image.getHeight() * scale;
            cs.drawImage(image, (pageW - w) / 2, (pageH - h) / 2, w, h);
        }
    }

    private void mergePdf(PDDocument output, Resource resource) throws IOException {
        PDFMergerUtility merger = new PDFMergerUtility();
        try (PDDocument source = Loader.loadPDF(resource.getContentAsByteArray())) {
            merger.appendDocument(output, source);
        }
    }
}
