package com.incomeoutcome.scheduler;

import com.incomeoutcome.dto.SummaryResponse;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.UserRepository;
import com.incomeoutcome.service.EmailService;
import com.incomeoutcome.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnBean(EmailService.class)
@RequiredArgsConstructor
@Slf4j
public class MonthlySummaryScheduler {

    private final UserRepository userRepository;
    private final ReportService reportService;
    private final EmailService emailService;

    // First day of each month at 08:00
    @Scheduled(cron = "0 0 8 1 * *")
    public void sendMonthlySummaries() {
        log.info("Sending monthly summaries to all users");
        List<User> users = userRepository.findAll();
        for (User user : users) {
            try {
                SummaryResponse summary = reportService.getSummary(user);
                String html = buildHtml(user, summary);
                emailService.sendHtml(user.getEmail(), "Your Monthly Financial Summary", html);
            } catch (Exception e) {
                log.error("Failed to send monthly summary to {}: {}", user.getEmail(), e.getMessage());
            }
        }
        log.info("Monthly summary emails dispatched to {} users", users.size());
    }

    private String buildHtml(User user, SummaryResponse summary) {
        StringBuilder sb = new StringBuilder();
        sb.append("<h2>Monthly Financial Summary</h2>");
        sb.append("<p>Hello, ").append(user.getEmail()).append("!</p>");
        sb.append("<h3>Income by currency</h3><ul>");
        summary.totalIncomeByCurrency().forEach((c, v) ->
                sb.append("<li>").append(c).append(": ").append(v).append("</li>"));
        sb.append("</ul>");
        sb.append("<h3>Expenses by currency</h3><ul>");
        summary.totalExpenseByCurrency().forEach((c, v) ->
                sb.append("<li>").append(c).append(": ").append(v).append("</li>"));
        sb.append("</ul>");
        sb.append("<p><strong>Net (EUR): ").append(summary.netInEur()).append("</strong></p>");
        return sb.toString();
    }
}
