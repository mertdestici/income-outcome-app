package com.incomeoutcome.scheduler;

import com.incomeoutcome.dto.ExpenseResponse;
import com.incomeoutcome.dto.LedgerMonthResponse;
import com.incomeoutcome.dto.LedgerTotalRow;
import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.RecurrenceRule;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.UserRepository;
import com.incomeoutcome.service.EmailService;
import com.incomeoutcome.service.LedgerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class LedgerReminderSchedulerTest {

    private static final LocalDate TODAY = LocalDate.of(2026, 9, 26);

    private final LedgerService ledgerService = mock(LedgerService.class);
    private final EmailService emailService = mock(EmailService.class);
    private final LedgerReminderScheduler scheduler =
            new LedgerReminderScheduler(mock(UserRepository.class), ledgerService, emailService);
    private final User user = User.builder().email("me@example.com").dailyReminderEnabled(true).build();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(scheduler, "frontendUrl", "https://app.example.com/");
    }

    private static LedgerMonthResponse month(List<LocalDate> missing, List<ExpenseResponse> expenses,
                                             List<LedgerTotalRow> byCard) {
        return new LedgerMonthResponse(2026, 9, Map.of(Currency.USD, new BigDecimal("50.50")),
                byCard, List.of(), expenses, List.of(), missing);
    }

    @Test
    void remindsWhenTodayIsMissing_andListsEarlierGaps() {
        when(ledgerService.getMonth(YearMonth.of(2026, 9), user))
                .thenReturn(month(List.of(LocalDate.of(2026, 9, 3), TODAY), List.of(), List.of()));

        scheduler.sendDailyReminderIfNeeded(user, TODAY);

        verify(emailService).sendHtml(eq("me@example.com"), eq("Log today's expenses"), argThat(html ->
                html.contains("https://app.example.com/#ledger/2026-09-26")
                        && html.contains("#ledger/2026-09-03")));
    }

    @Test
    void staysQuietWhenTodayIsLoggedOrMarkedNoSpend() {
        when(ledgerService.getMonth(YearMonth.of(2026, 9), user))
                .thenReturn(month(List.of(LocalDate.of(2026, 9, 3)), List.of(), List.of()));

        scheduler.sendDailyReminderIfNeeded(user, TODAY);

        verifyNoInteractions(emailService);
    }

    @Test
    void monthTableEscapesUserText() {
        ExpenseResponse e = new ExpenseResponse(UUID.randomUUID(), "<b>Lunch</b>", new BigDecimal("12.00"),
                Currency.USD, TODAY, null, RecurrenceRule.NONE, "Visa", "Food", "a & b", Instant.now());
        LedgerTotalRow row = new LedgerTotalRow("<script>", Currency.USD, new BigDecimal("12.00"), 1,
                new BigDecimal("100.0"));

        String html = scheduler.buildMonthHtml(month(List.of(), List.of(e), List.of(row)),
                "September 2026", YearMonth.of(2026, 9));

        assertThat(html)
                .contains("&lt;b&gt;Lunch&lt;/b&gt;", "a &amp; b", "&lt;script&gt;", "100.0%",
                        "https://app.example.com/#ledger-month/2026-09")
                .doesNotContain("<script>");
    }
}
