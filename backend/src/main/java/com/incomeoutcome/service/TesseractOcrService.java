package com.incomeoutcome.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@ConditionalOnProperty(name = "app.ocr.provider", havingValue = "tesseract")
@Slf4j
public class TesseractOcrService implements OcrService {

    @Value("${app.ocr.tesseract.data-path:classpath:tessdata}")
    private String dataPath;

    @Value("${app.ocr.tesseract.language:eng}")
    private String language;

    @Autowired
    private ResourceLoader resourceLoader;

    /** Resolved filesystem path to the tessdata directory. */
    private String resolvedDataPath;

    @PostConstruct
    public void init() {
        try {
            org.springframework.core.io.Resource r = resourceLoader.getResource(dataPath);
            resolvedDataPath = r.getFile().getAbsolutePath();
            log.info("Tesseract tessdata resolved to: {}", resolvedDataPath);
        } catch (IOException e) {
            // Not a classpath resource or can't be resolved to a File — use as-is
            resolvedDataPath = dataPath;
            log.info("Tesseract tessdata path: {}", resolvedDataPath);
        }
    }

    @Override
    public OcrResult extract(File file) {
        try {
            String text = isPdf(file) ? ocrPdf(file) : ocrImage(file);
            log.debug("OCR raw text for {}:\n{}", file.getName(), text);
            return parse(text);
        } catch (Exception | Error e) {
            log.error("Tesseract OCR failed for {}: {}", file.getName(), e.getMessage());
            throw new RuntimeException("OCR failed: " + e.getMessage(), e);
        }
    }

    // ── File type detection via magic bytes ──────────────────────────────────────

    private boolean isPdf(File file) {
        try (FileInputStream fis = new FileInputStream(file)) {
            byte[] header = new byte[4];
            return fis.read(header) == 4
                    && header[0] == 0x25  // %
                    && header[1] == 0x50  // P
                    && header[2] == 0x44  // D
                    && header[3] == 0x46; // F
        } catch (IOException e) {
            return false;
        }
    }

    // ── OCR execution ─────────────────────────────────────────────────────────────

    private String ocrImage(File imageFile) throws Exception {
        return buildTesseract().doOCR(imageFile);
    }

    private String ocrPdf(File pdfFile) throws Exception {
        try (PDDocument document = Loader.loadPDF(pdfFile)) {
            PDFRenderer renderer = new PDFRenderer(document);
            // Render first page at 300 DPI for good recognition quality
            BufferedImage image = renderer.renderImageWithDPI(0, 300);
            return buildTesseract().doOCR(image);
        }
    }

    private Tesseract buildTesseract() {
        Tesseract tesseract = new Tesseract();
        if (resolvedDataPath != null && !resolvedDataPath.isBlank()) {
            tesseract.setDatapath(resolvedDataPath);
        }
        tesseract.setLanguage(language);
        return tesseract;
    }

    // ── Parsing ───────────────────────────────────────────────────────────────────

    private OcrResult parse(String text) {
        if (text == null || text.isBlank()) return new OcrResult(null, null, null);
        String[] lines = text.split("\\r?\\n");
        return new OcrResult(extractVendor(lines), extractDate(text), extractAmount(text));
    }

    /** First line with ≥3 chars that contains at least one letter (not a pure date/number row). */
    private String extractVendor(String[] lines) {
        for (String line : lines) {
            line = line.trim();
            if (line.length() >= 3 && line.matches(".*[A-Za-zÇĞİÖŞÜçğışöşü].*")
                    && !line.matches("^[\\d .,:/-]+$")) {
                return line;
            }
        }
        return null;
    }

    // Date patterns: DD.MM.YYYY / DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    private record DatePattern(Pattern pattern, DateTimeFormatter formatter) {}

    private static final List<DatePattern> DATE_PATTERNS = List.of(
        new DatePattern(
            Pattern.compile("\\b(\\d{2})[./](\\d{2})[./](\\d{4})\\b"),
            DateTimeFormatter.ofPattern("dd.MM.yyyy")),
        new DatePattern(
            Pattern.compile("\\b(\\d{4})-(\\d{2})-(\\d{2})\\b"),
            DateTimeFormatter.ofPattern("yyyy-MM-dd")),
        new DatePattern(
            Pattern.compile("\\b(\\d{2})-(\\d{2})-(\\d{4})\\b"),
            DateTimeFormatter.ofPattern("dd-MM-yyyy"))
    );

    private LocalDate extractDate(String text) {
        for (DatePattern dp : DATE_PATTERNS) {
            Matcher m = dp.pattern().matcher(text);
            if (m.find()) {
                String raw = m.group().replace('/', '.');
                try {
                    return LocalDate.parse(raw, dp.formatter());
                } catch (DateTimeParseException ignored) {}
            }
        }
        return null;
    }

    // Keywords that appear just before the total amount on receipts/invoices
    private static final List<String> TOTAL_KEYWORDS = List.of(
        "GENEL TOPLAM", "GRAND TOTAL", "TOPLAM TUTAR", "TOPLAM",
        "TUTAR", "TOTAL", "AMOUNT DUE", "AMOUNT"
    );

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "([\\d]{1,3}(?:[.,][\\d]{3})*[.,][\\d]{2}|[\\d]+[.,][\\d]{2})");

    private BigDecimal extractAmount(String text) {
        String upper = text.toUpperCase(Locale.ROOT);
        for (String kw : TOTAL_KEYWORDS) {
            int idx = upper.indexOf(kw);
            if (idx < 0) continue;
            String snippet = text.substring(idx + kw.length(),
                    Math.min(idx + kw.length() + 50, text.length()));
            Matcher m = AMOUNT_PATTERN.matcher(snippet);
            if (m.find()) {
                BigDecimal parsed = parseDecimal(m.group());
                if (parsed != null) return parsed;
            }
        }
        return null;
    }

    /**
     * Handles:
     *   1.234,56  → European (comma = decimal)  → 1234.56
     *   1,234.56  → US      (dot = decimal)     → 1234.56
     *   52,25     → Turkish (comma = decimal)    → 52.25
     *   52.25     → standard                    → 52.25
     */
    private BigDecimal parseDecimal(String raw) {
        try {
            boolean hasComma = raw.contains(",");
            boolean hasDot   = raw.contains(".");
            if (hasComma && hasDot) {
                int lastDot   = raw.lastIndexOf('.');
                int lastComma = raw.lastIndexOf(',');
                if (lastComma > lastDot) {
                    // European: 1.234,56
                    return new BigDecimal(raw.replace(".", "").replace(",", "."));
                } else {
                    // US: 1,234.56
                    return new BigDecimal(raw.replace(",", ""));
                }
            }
            if (hasComma) {
                // Turkish: 52,25
                return new BigDecimal(raw.replace(",", "."));
            }
            return new BigDecimal(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
