package com.incomeoutcome.repository;

import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.DocumentType;
import com.incomeoutcome.entity.Expense;
import com.incomeoutcome.entity.RecurrenceRule;
import com.incomeoutcome.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    @Query("""
            SELECT e FROM Expense e
            WHERE e.user = :user
            AND (:currency IS NULL OR e.currency = :currency)
            AND (:documentType IS NULL OR e.documentType = :documentType)
            AND (:from IS NULL OR e.date >= :from)
            AND (:to IS NULL OR e.date <= :to)
            """)
    Page<Expense> findWithFilters(
            @Param("user") User user,
            @Param("currency") Currency currency,
            @Param("documentType") DocumentType documentType,
            @Param("from") LocalDate from,
            @Param("to") LocalDate to,
            Pageable pageable
    );

    Optional<Expense> findByIdAndUser(UUID id, User user);

    // Reports: [currency, sum, count]
    @Query("""
            SELECT e.currency, SUM(e.amount), COUNT(e)
            FROM Expense e WHERE e.user = :user
            GROUP BY e.currency
            """)
    List<Object[]> sumAndCountByCurrency(@Param("user") User user);

    // Reports: [year, month, currency, sum]
    @Query("""
            SELECT EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date),
                   e.currency, SUM(e.amount)
            FROM Expense e WHERE e.user = :user
            GROUP BY EXTRACT(YEAR FROM e.date), EXTRACT(MONTH FROM e.date), e.currency
            ORDER BY EXTRACT(YEAR FROM e.date) DESC, EXTRACT(MONTH FROM e.date) DESC
            """)
    List<Object[]> monthlySum(@Param("user") User user);

    // Recurring: find due entries
    List<Expense> findByRecurrenceRuleNotAndNextOccurrenceLessThanEqual(RecurrenceRule none, LocalDate today);
}
