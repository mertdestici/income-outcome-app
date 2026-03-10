package com.incomeoutcome.scheduler;

import com.incomeoutcome.entity.Expense;
import com.incomeoutcome.entity.Income;
import com.incomeoutcome.entity.RecurrenceRule;
import com.incomeoutcome.repository.ExpenseRepository;
import com.incomeoutcome.repository.IncomeRepository;
import com.incomeoutcome.service.IncomeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class RecurringEntryScheduler {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;

    @Scheduled(cron = "0 0 1 * * *")  // daily at 01:00
    @Transactional
    public void processRecurringEntries() {
        LocalDate today = LocalDate.now();
        processIncomes(today);
        processExpenses(today);
    }

    private void processIncomes(LocalDate today) {
        List<Income> due = incomeRepository
                .findByRecurrenceRuleNotAndNextOccurrenceLessThanEqual(RecurrenceRule.NONE, today);
        for (Income template : due) {
            Income copy = Income.builder()
                    .user(template.getUser())
                    .title(template.getTitle())
                    .amount(template.getAmount())
                    .currency(template.getCurrency())
                    .recurrenceRule(RecurrenceRule.NONE)
                    .build();
            incomeRepository.save(copy);

            LocalDate nextOccurrence = IncomeService.computeNextOccurrence(template.getRecurrenceRule(), today);
            Income updated = Income.builder()
                    .id(template.getId())
                    .user(template.getUser())
                    .title(template.getTitle())
                    .amount(template.getAmount())
                    .currency(template.getCurrency())
                    .recurrenceRule(template.getRecurrenceRule())
                    .nextOccurrence(nextOccurrence)
                    .createdAt(template.getCreatedAt())
                    .build();
            incomeRepository.save(updated);
            log.debug("Generated recurring income copy for template {}", template.getId());
        }
        if (!due.isEmpty()) log.info("Processed {} recurring income entries", due.size());
    }

    private void processExpenses(LocalDate today) {
        List<Expense> due = expenseRepository
                .findByRecurrenceRuleNotAndNextOccurrenceLessThanEqual(RecurrenceRule.NONE, today);
        for (Expense template : due) {
            Expense copy = Expense.builder()
                    .user(template.getUser())
                    .title(template.getTitle())
                    .amount(template.getAmount())
                    .currency(template.getCurrency())
                    .date(today)
                    .documentType(template.getDocumentType())
                    .recurrenceRule(RecurrenceRule.NONE)
                    .build();
            expenseRepository.save(copy);

            LocalDate nextOccurrence = IncomeService.computeNextOccurrence(template.getRecurrenceRule(), today);
            Expense updated = Expense.builder()
                    .id(template.getId())
                    .user(template.getUser())
                    .title(template.getTitle())
                    .amount(template.getAmount())
                    .currency(template.getCurrency())
                    .date(template.getDate())
                    .documentType(template.getDocumentType())
                    .recurrenceRule(template.getRecurrenceRule())
                    .nextOccurrence(nextOccurrence)
                    .createdAt(template.getCreatedAt())
                    .build();
            expenseRepository.save(updated);
            log.debug("Generated recurring expense copy for template {}", template.getId());
        }
        if (!due.isEmpty()) log.info("Processed {} recurring expense entries", due.size());
    }
}
