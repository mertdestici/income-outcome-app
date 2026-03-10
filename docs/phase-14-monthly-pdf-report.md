# Phase 14: Monthly PDF Report (Backend)

## Status: Complete

## Overview

On the **20th of each month at 08:00**, the backend compiles all documents uploaded by a user during the previous calendar month into a single PDF and emails it to a configurable recipient address. Users set their recipient email via a new `/api/settings` endpoint. If no address is configured, no email is sent. PDF generation uses **Apache PDFBox** (no licence restrictions).

---

## Files to Change

### Flyway Migration

- `V12__user_report_email.sql`
  ```sql
  ALTER TABLE users ADD COLUMN report_email VARCHAR(255);
  ```

### Entity

- `entity/User.java` — add field
  ```java
  @Column(name = "report_email")
  private String reportEmail;

  public void setReportEmail(String reportEmail) {
      this.reportEmail = reportEmail;
  }
  ```

### Repository

- `repository/UserRepository.java` — add query
  ```java
  // Fetch all users who have a report email configured
  List<User> findAllByReportEmailIsNotNull();
  ```

- `repository/DocumentRepository.java` — add query
  ```java
  // Fetch all documents linked to expenses in a given month/year for a user
  @Query("""
      SELECT d FROM Document d
      JOIN d.expense e
      WHERE d.user = :user
        AND YEAR(e.date) = :year
        AND MONTH(e.date) = :month
        AND d.ocrStatus = 'DONE'
      ORDER BY e.date ASC
  """)
  List<Document> findByUserAndExpenseMonth(
      @Param("user") User user,
      @Param("year") int year,
      @Param("month") int month
  );
  ```

### DTOs

- `dto/UserSettingsResponse.java` (new record)
  ```java
  public record UserSettingsResponse(String reportEmail) {}
  ```

- `dto/UpdateSettingsRequest.java` (new record)
  ```java
  public record UpdateSettingsRequest(
      @Email @Size(max = 255) String reportEmail   // null = disable
  ) {}
  ```

### Service — UserSettingsService (new)

- `service/UserSettingsService.java`
  ```java
  @Service
  @RequiredArgsConstructor
  public class UserSettingsService {
      private final UserRepository userRepository;

      public UserSettingsResponse getSettings(User user) {
          return new UserSettingsResponse(user.getReportEmail());
      }

      @Transactional
      public UserSettingsResponse updateSettings(UpdateSettingsRequest req, User user) {
          user.setReportEmail(req.reportEmail());
          userRepository.save(user);
          return new UserSettingsResponse(user.getReportEmail());
      }
  }
  ```

### Controller — SettingsController (new)

- `controller/SettingsController.java` — `@RequestMapping("/api/settings")`
  - `GET /api/settings` → 200 + `UserSettingsResponse`
  - `PUT /api/settings` → 200 + `UserSettingsResponse`

### Service — PdfReportService (new)

- `service/PdfReportService.java`

  Uses **Apache PDFBox** (`org.apache.pdfbox:pdfbox:3.0.x`).

  ```java
  @Service
  @RequiredArgsConstructor
  public class PdfReportService {
      private final StorageService storageService;

      /**
       * Builds a single PDF containing all documents for the given user/month.
       * Each document is appended as one or more pages:
       *   - image (JPEG/PNG/WebP) → embedded as a full-page image
       *   - PDF → pages merged via PDFMergerUtility
       * Returns null if there are no documents.
       */
      public byte[] generateMonthlyReport(User user, List<Document> documents, int year, int month)
              throws IOException {
          if (documents.isEmpty()) return null;

          try (PDDocument output = new PDDocument()) {
              for (Document doc : documents) {
                  Resource resource = storageService.load(doc.getFilePath());

                  if (doc.getContentType().startsWith("image/")) {
                      appendImagePage(output, resource);
                  } else if ("application/pdf".equals(doc.getContentType())) {
                      mergePdf(output, resource);
                  }
                  // Other types: skip (already filtered by upload allowlist)
              }

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
              // Scale image to fit A4 while preserving aspect ratio
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
  ```

### Service — EmailService

- `service/EmailService.java` — add `sendWithAttachment()` method
  ```java
  public void sendWithAttachment(String to, String subject, String htmlBody,
                                  String attachmentName, byte[] attachmentBytes) {
      try {
          var message = mailSender.createMimeMessage();
          var helper = new MimeMessageHelper(message, true, "UTF-8");
          helper.setTo(to);
          helper.setSubject(subject);
          helper.setText(htmlBody, true);
          helper.addAttachment(attachmentName,
              new ByteArrayResource(attachmentBytes), "application/pdf");
          mailSender.send(message);
          log.info("Email with attachment sent to {}: {}", to, subject);
      } catch (Exception e) {
          log.error("Failed to send email with attachment to {}: {}", to, e.getMessage());
      }
  }
  ```

### Scheduler — MonthlyReportScheduler (new)

- `scheduler/MonthlyReportScheduler.java`
  ```java
  @Component
  @ConditionalOnBean(EmailService.class)
  @RequiredArgsConstructor
  @Slf4j
  public class MonthlyReportScheduler {
      private final UserRepository userRepository;
      private final DocumentRepository documentRepository;
      private final PdfReportService pdfReportService;
      private final EmailService emailService;

      // 08:00 on the 20th of every month
      @Scheduled(cron = "0 0 8 20 * *")
      public void sendMonthlyReports() {
          YearMonth reportMonth = YearMonth.now().minusMonths(1);
          int year  = reportMonth.getYear();
          int month = reportMonth.getMonthValue();
          String monthLabel = reportMonth.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH)
                  + " " + year;

          List<User> users = userRepository.findAllByReportEmailIsNotNull();
          log.info("Monthly report: processing {} users for {}", users.size(), monthLabel);

          for (User user : users) {
              try {
                  List<Document> docs = documentRepository.findByUserAndExpenseMonth(user, year, month);
                  if (docs.isEmpty()) {
                      log.info("No documents for user {} in {}", user.getId(), monthLabel);
                      continue;
                  }

                  byte[] pdf = pdfReportService.generateMonthlyReport(user, docs, year, month);
                  if (pdf == null) continue;

                  String subject = "Your " + monthLabel + " Expense Documents";
                  String body    = buildHtmlBody(user, monthLabel, docs.size());
                  String filename = "expense-report-" + reportMonth + ".pdf";

                  emailService.sendWithAttachment(user.getReportEmail(), subject, body, filename, pdf);
                  log.info("Sent monthly report to {} ({} documents)", user.getReportEmail(), docs.size());

              } catch (Exception e) {
                  log.error("Failed monthly report for user {}: {}", user.getId(), e.getMessage());
                  // Continue with next user — one failure must not block others
              }
          }
      }

      private String buildHtmlBody(User user, String monthLabel, int documentCount) {
          return """
              <html><body>
              <p>Hi %s,</p>
              <p>Please find attached your expense document report for <strong>%s</strong>.</p>
              <p>Total documents: <strong>%d</strong></p>
              <p>— Income/Expense App</p>
              </body></html>
              """.formatted(user.getEmail(), monthLabel, documentCount);
      }
  }
  ```

### Config

- `application.yml` — ensure `@EnableScheduling` is active (already present from `MonthlySummaryScheduler`)
- `build.gradle.kts` — add dependency:
  ```kotlin
  implementation("org.apache.pdfbox:pdfbox:3.0.3")
  ```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/settings` | Bearer | Get current user's settings → UserSettingsResponse |
| PUT | `/api/settings` | Bearer | Update report email → UserSettingsResponse |

---

## Key Design Decisions

- **Apache PDFBox over iText** — PDFBox is Apache-licensed (no AGPL complications); iText 7 community is AGPL which may be restrictive
- **Previous month's documents** — report sent on the 20th covers the _previous_ calendar month, giving users time to upload any late receipts before the cutoff
- **Only `DONE` documents included** — documents with `FAILED` OCR status are excluded; they have no verified expense link
- **Per-user error isolation** — one user's failure (e.g. corrupted file) does not abort the batch; each user is wrapped in its own try/catch
- **`@ConditionalOnBean(EmailService.class)`** — scheduler is inactive unless SMTP is configured (same pattern as `MonthlySummaryScheduler`)
- **`report_email` stored on `users`** — avoids a separate settings table for a single column; expand to a `user_settings` table if more settings are added later

---

## Validation Rules

| Rule | Behavior |
|------|----------|
| `reportEmail` format invalid | 400 (Bean Validation `@Email`) |
| `reportEmail` set to null | Disables monthly report for that user |
| No documents for the month | Scheduler skips silently (no email sent) |
| PDF generation fails for one user | Logged as error, other users continue |

---

## Verification Steps

```bash
# Set report email
curl -X PUT http://localhost:8080/api/settings \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reportEmail":"accountant@example.com"}'

# Confirm it was saved
curl http://localhost:8080/api/settings \
  -H "Authorization: Bearer TOKEN"
# → { "reportEmail": "accountant@example.com" }

# Trigger the scheduler manually in dev (via a test endpoint or Spring Actuator)
curl -X POST http://localhost:8080/actuator/scheduledtasks   # inspect cron
# Or invoke directly in a @Test using MonthlyReportScheduler.sendMonthlyReports()
```
