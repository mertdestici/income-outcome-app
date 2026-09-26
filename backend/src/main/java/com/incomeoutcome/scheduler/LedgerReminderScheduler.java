package com.incomeoutcome.scheduler;

import com.incomeoutcome.dto.ExpenseResponse;
import com.incomeoutcome.dto.LedgerMonthResponse;
import com.incomeoutcome.dto.LedgerTotalRow;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.UserRepository;
import com.incomeoutcome.service.EmailService;
import com.incomeoutcome.service.LedgerService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;

import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

/**
 * Nightly Ledger emails. Runs hourly and acts on each user's local clock:
 *  - 20:00 daily   — "log today's expenses" if today has no expense and no no-spend mark
 *  - 09:00 on the 1st — last month's ledger table (by card, by category, every expense)
 */
@Component
@ConditionalOnBean(EmailService.class)
@RequiredArgsConstructor
@Slf4j
public class LedgerReminderScheduler {

    static final int DAILY_REMINDER_HOUR  = 20;
    static final int MONTHLY_LEDGER_HOUR  = 9;

    private final UserRepository userRepository;
    private final LedgerService ledgerService;
    private final EmailService emailService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Scheduled(cron = "0 0 * * * *")
    public void run() {
        List<User> users = userRepository.findAllByDailyReminderEnabledTrueOrMonthlyLedgerEnabledTrue();
        for (User user : users) {
            try {
                ZonedDateTime now = ZonedDateTime.now(ZoneId.of(user.getTimezone()));
                if (user.isDailyReminderEnabled() && now.getHour() == DAILY_REMINDER_HOUR) {
                    sendDailyReminderIfNeeded(user, now.toLocalDate());
                }
                if (user.isMonthlyLedgerEnabled() && now.getDayOfMonth() == 1 && now.getHour() == MONTHLY_LEDGER_HOUR) {
                    sendMonthlyLedger(user, YearMonth.from(now).minusMonths(1));
                }
            } catch (Exception e) {
                log.error("Ledger reminder failed for user {}: {}", user.getId(), e.getMessage());
                // Continue with next user — one failure must not block others
            }
        }
    }

    void sendDailyReminderIfNeeded(User user, LocalDate today) {
        LedgerMonthResponse month = ledgerService.getMonth(YearMonth.from(today), user);
        if (!month.missingDays().contains(today)) return;   // already logged or marked no-spend

        StringBuilder sb = new StringBuilder("<html><body>");
        sb.append("<p>Hi,</p><p>You haven't logged any expenses for <strong>")
          .append(today).append("</strong> yet.</p>");
        sb.append("<p><a href=\"").append(link("ledger/" + today)).append("\">Log today's expenses</a>")
          .append(" — or mark it as a no-spend day.</p>");
        List<LocalDate> earlier = month.missingDays().stream().filter(d -> d.isBefore(today)).toList();
        if (!earlier.isEmpty()) {
            sb.append("<p>Other days this month with no entry:</p><ul>");
            for (LocalDate d : earlier) {
                sb.append("<li><a href=\"").append(link("ledger/" + d)).append("\">").append(d).append("</a></li>");
            }
            sb.append("</ul>");
        }
        sb.append("<p>— Income/Expense App</p></body></html>");
        emailService.sendHtml(user.getEmail(), "Log today's expenses", sb.toString());
    }

    void sendMonthlyLedger(User user, YearMonth ym) {
        LedgerMonthResponse month = ledgerService.getMonth(ym, user);
        String label = ym.getMonth().getDisplayName(TextStyle.FULL, Locale.ENGLISH) + " " + ym.getYear();
        emailService.sendHtml(user.getEmail(), "Your " + label + " expense table", buildMonthHtml(month, label, ym));
        log.info("Sent monthly ledger for {} to user {}", ym, user.getId());
    }

    String buildMonthHtml(LedgerMonthResponse m, String label, YearMonth ym) {
        StringBuilder sb = new StringBuilder("<html><body style=\"font-family:sans-serif\">");
        sb.append("<h2>").append(label).append(" expenses</h2>");
        if (m.expenses().isEmpty()) {
            sb.append("<p>No expenses were logged this month.</p>");
        } else {
            sb.append("<p>Total: ");
            m.totals().forEach((c, v) -> sb.append("<strong>").append(v.toPlainString()).append(' ').append(c).append("</strong> "));
            sb.append("</p>");
            totalsTable(sb, "By card", "Card", m.byCard());
            totalsTable(sb, "By category", "Category", m.byCategory());

            sb.append("<h3>Every expense</h3>").append(TABLE)
              .append("<tr><th>Date</th><th>Title</th><th>Card</th><th>Category</th><th>Amount</th><th>Note</th></tr>");
            for (ExpenseResponse e : m.expenses()) {
                sb.append("<tr><td>").append(e.date()).append("</td><td>").append(esc(e.title()))
                  .append("</td><td>").append(esc(e.card())).append("</td><td>").append(esc(e.category()))
                  .append("</td><td style=\"text-align:right\">").append(e.amount().toPlainString()).append(' ').append(e.currency())
                  .append("</td><td>").append(esc(e.note())).append("</td></tr>");
            }
            sb.append("</table>");
        }
        if (!m.missingDays().isEmpty()) {
            sb.append("<p>Days with no entry: ");
            for (LocalDate d : m.missingDays()) sb.append(d.getDayOfMonth()).append(' ');
            sb.append("</p>");
        }
        sb.append("<p><a href=\"").append(link("ledger-month/" + ym)).append("\">Open in the app</a></p>");
        sb.append("<p>— Income/Expense App</p></body></html>");
        return sb.toString();
    }

    private static final String TABLE =
            "<table border=\"1\" cellpadding=\"6\" cellspacing=\"0\" style=\"border-collapse:collapse\">";

    private static void totalsTable(StringBuilder sb, String heading, String column, List<LedgerTotalRow> rows) {
        sb.append("<h3>").append(heading).append("</h3>").append(TABLE)
          .append("<tr><th>").append(column).append("</th><th>Count</th><th>Total</th><th>Share</th></tr>");
        for (LedgerTotalRow r : rows) {
            sb.append("<tr><td>").append(esc(r.label())).append("</td><td>").append(r.count())
              .append("</td><td style=\"text-align:right\">").append(r.total().toPlainString()).append(' ').append(r.currency())
              .append("</td><td style=\"text-align:right\">").append(r.sharePercent().toPlainString()).append("%</td></tr>");
        }
        sb.append("</table>");
    }

    private String link(String hashRoute) {
        return frontendUrl.replaceAll("/+$", "") + "/#" + hashRoute;
    }

    private static String esc(String s) {
        return HtmlUtils.htmlEscape(Objects.requireNonNullElse(s, ""));
    }
}
