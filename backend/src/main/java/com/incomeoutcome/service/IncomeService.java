package com.incomeoutcome.service;

import com.incomeoutcome.dto.CreateIncomeRequest;
import com.incomeoutcome.dto.IncomeResponse;
import com.incomeoutcome.dto.UpdateIncomeRequest;
import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.Income;
import com.incomeoutcome.entity.RecurrenceRule;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.ResourceNotFoundException;
import com.incomeoutcome.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final AuditService auditService;

    @Transactional
    public IncomeResponse create(CreateIncomeRequest request, User user) {
        RecurrenceRule rule = request.recurrenceRule() != null ? request.recurrenceRule() : RecurrenceRule.NONE;
        Income income = Income.builder()
                .user(user)
                .title(request.title())
                .amount(request.amount())
                .currency(request.currency())
                .recurrenceRule(rule)
                .nextOccurrence(computeNextOccurrence(rule, java.time.LocalDate.now()))
                .build();
        IncomeResponse response = toResponse(incomeRepository.save(income));
        auditService.log(user, "INCOME", response.id(), "CREATE", response);
        return response;
    }

    @Transactional(readOnly = true)
    public Page<IncomeResponse> list(User user, Currency currency, Instant from, Instant to, Pageable pageable) {
        Page<Income> page;
        if (currency != null && from != null && to != null) {
            page = incomeRepository.findByUserAndCurrencyAndCreatedAtBetween(user, currency, from, to, pageable);
        } else if (currency != null) {
            page = incomeRepository.findByUserAndCurrency(user, currency, pageable);
        } else if (from != null && to != null) {
            page = incomeRepository.findByUserAndCreatedAtBetween(user, from, to, pageable);
        } else {
            page = incomeRepository.findByUser(user, pageable);
        }
        return page.map(this::toResponse);
    }

    @Transactional
    public IncomeResponse update(UUID id, UpdateIncomeRequest request, User user) {
        Income income = incomeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found"));
        RecurrenceRule rule = request.recurrenceRule() != null ? request.recurrenceRule() : RecurrenceRule.NONE;
        Income updated = Income.builder()
                .id(income.getId())
                .user(income.getUser())
                .title(request.title())
                .amount(request.amount())
                .currency(request.currency())
                .recurrenceRule(rule)
                .nextOccurrence(computeNextOccurrence(rule, java.time.LocalDate.now()))
                .createdAt(income.getCreatedAt())
                .build();
        IncomeResponse response = toResponse(incomeRepository.save(updated));
        auditService.log(user, "INCOME", id, "UPDATE", response);
        return response;
    }

    @Transactional
    public void delete(UUID id, User user) {
        Income income = incomeRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found"));
        auditService.log(user, "INCOME", id, "DELETE", toResponse(income));
        incomeRepository.delete(income);
    }

    private IncomeResponse toResponse(Income income) {
        return new IncomeResponse(
                income.getId(),
                income.getTitle(),
                income.getAmount(),
                income.getCurrency(),
                income.getRecurrenceRule(),
                income.getCreatedAt()
        );
    }

    public static java.time.LocalDate computeNextOccurrence(RecurrenceRule rule, java.time.LocalDate from) {
        return switch (rule) {
            case WEEKLY  -> from.plusWeeks(1);
            case MONTHLY -> from.plusMonths(1);
            case YEARLY  -> from.plusYears(1);
            case NONE    -> null;
        };
    }
}
