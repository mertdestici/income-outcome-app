package com.incomeoutcome.repository;

import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.Income;
import com.incomeoutcome.entity.RecurrenceRule;
import com.incomeoutcome.entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IncomeRepository extends JpaRepository<Income, UUID> {

    Page<Income> findByUser(User user, Pageable pageable);

    Page<Income> findByUserAndCurrency(User user, Currency currency, Pageable pageable);

    Page<Income> findByUserAndCreatedAtBetween(User user, Instant from, Instant to, Pageable pageable);

    Page<Income> findByUserAndCurrencyAndCreatedAtBetween(User user, Currency currency, Instant from, Instant to, Pageable pageable);

    Optional<Income> findByIdAndUser(UUID id, User user);

    // Reports: [currency, sum, count]
    @Query("""
            SELECT i.currency, SUM(i.amount), COUNT(i)
            FROM Income i WHERE i.user = :user
            GROUP BY i.currency
            """)
    List<Object[]> sumAndCountByCurrency(@Param("user") User user);

    // Reports: [year, month, currency, sum]
    @Query("""
            SELECT EXTRACT(YEAR FROM i.createdAt), EXTRACT(MONTH FROM i.createdAt),
                   i.currency, SUM(i.amount)
            FROM Income i WHERE i.user = :user
            GROUP BY EXTRACT(YEAR FROM i.createdAt), EXTRACT(MONTH FROM i.createdAt), i.currency
            ORDER BY EXTRACT(YEAR FROM i.createdAt) DESC, EXTRACT(MONTH FROM i.createdAt) DESC
            """)
    List<Object[]> monthlySum(@Param("user") User user);

    // Recurring: find due entries
    List<Income> findByRecurrenceRuleNotAndNextOccurrenceLessThanEqual(RecurrenceRule none, LocalDate today);
}
