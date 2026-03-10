package com.incomeoutcome.service;

import com.incomeoutcome.dto.CreateExpenseRequest;
import com.incomeoutcome.dto.ExpenseResponse;
import com.incomeoutcome.dto.UpdateExpenseRequest;
import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.DocumentType;
import com.incomeoutcome.entity.Expense;
import com.incomeoutcome.entity.RecurrenceRule;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.ResourceNotFoundException;
import com.incomeoutcome.repository.DocumentRepository;
import com.incomeoutcome.repository.ExpenseRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final DocumentRepository documentRepository;
    private final AuditService auditService;

    @Transactional
    public ExpenseResponse create(CreateExpenseRequest request, User user) {
        RecurrenceRule rule = request.recurrenceRule() != null ? request.recurrenceRule() : RecurrenceRule.NONE;
        Expense expense = Expense.builder()
                .user(user)
                .title(request.title())
                .amount(request.amount())
                .currency(request.currency())
                .date(request.date())
                .documentType(request.documentType())
                .recurrenceRule(rule)
                .nextOccurrence(IncomeService.computeNextOccurrence(rule, request.date()))
                .build();
        Expense saved = expenseRepository.save(expense);

        // Link a pre-uploaded OCR document to this expense if provided
        if (request.documentId() != null) {
            documentRepository.findByIdAndUser(request.documentId(), user)
                    .ifPresent(doc -> {
                        doc.setExpense(saved);
                        documentRepository.save(doc);
                    });
        }

        ExpenseResponse response = toResponse(saved);
        auditService.log(user, "EXPENSE", response.id(), "CREATE", response);
        return response;
    }

    @Transactional(readOnly = true)
    public Page<ExpenseResponse> list(
            User user,
            Currency currency,
            DocumentType documentType,
            Integer month,
            Integer year,
            Pageable pageable
    ) {
        LocalDate from = null;
        LocalDate to = null;
        if (month != null && year != null) {
            from = LocalDate.of(year, month, 1);
            to = from.withDayOfMonth(from.lengthOfMonth());
        } else if (year != null) {
            from = LocalDate.of(year, 1, 1);
            to = LocalDate.of(year, 12, 31);
        }
        return expenseRepository.findWithFilters(user, currency, documentType, from, to, pageable)
                .map(this::toResponse);
    }

    @Transactional
    public ExpenseResponse update(UUID id, UpdateExpenseRequest request, User user) {
        Expense expense = expenseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        RecurrenceRule rule = request.recurrenceRule() != null ? request.recurrenceRule() : RecurrenceRule.NONE;
        Expense updated = Expense.builder()
                .id(expense.getId())
                .user(expense.getUser())
                .title(request.title())
                .amount(request.amount())
                .currency(request.currency())
                .date(request.date())
                .documentType(request.documentType())
                .recurrenceRule(rule)
                .nextOccurrence(IncomeService.computeNextOccurrence(rule, request.date()))
                .createdAt(expense.getCreatedAt())
                .build();
        ExpenseResponse response = toResponse(expenseRepository.save(updated));
        auditService.log(user, "EXPENSE", id, "UPDATE", response);
        return response;
    }

    @Transactional
    public void delete(UUID id, User user) {
        Expense expense = expenseRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found"));
        auditService.log(user, "EXPENSE", id, "DELETE", toResponse(expense));
        expenseRepository.delete(expense);
    }

    private ExpenseResponse toResponse(Expense expense) {
        return new ExpenseResponse(
                expense.getId(),
                expense.getTitle(),
                expense.getAmount(),
                expense.getCurrency(),
                expense.getDate(),
                expense.getDocumentType(),
                expense.getRecurrenceRule(),
                expense.getCreatedAt()
        );
    }
}
