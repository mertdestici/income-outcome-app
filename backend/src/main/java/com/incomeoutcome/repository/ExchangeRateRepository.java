package com.incomeoutcome.repository;

import com.incomeoutcome.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, UUID> {

    Optional<ExchangeRate> findByBaseCurrencyAndTargetCurrency(String baseCurrency, String targetCurrency);
}
