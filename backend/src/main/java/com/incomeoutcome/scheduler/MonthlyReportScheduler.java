package com.incomeoutcome.scheduler;

import com.incomeoutcome.entity.Document;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.DocumentRepository;
import com.incomeoutcome.repository.UserRepository;
import com.incomeoutcome.service.EmailService;
import com.incomeoutcome.service.PdfReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.YearMonth;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;

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

                String subject  = "Your " + monthLabel + " Expense Documents";
                String body     = buildHtmlBody(user, monthLabel, docs.size());
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
