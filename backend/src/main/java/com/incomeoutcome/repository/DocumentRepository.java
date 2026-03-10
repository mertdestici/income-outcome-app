package com.incomeoutcome.repository;

import com.incomeoutcome.entity.Document;
import com.incomeoutcome.entity.Expense;
import com.incomeoutcome.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface DocumentRepository extends JpaRepository<Document, UUID> {

    List<Document> findByExpenseAndUser(Expense expense, User user);

    Optional<Document> findByIdAndUser(UUID id, User user);

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
}
