package com.incomeoutcome.service;

import com.incomeoutcome.dto.RateResponse;
import com.incomeoutcome.entity.ExchangeRate;
import com.incomeoutcome.repository.ExchangeRateRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final RestClient restClient;

    @Value("${app.rates.base-currency}")
    private String baseCurrency;

    @Value("${app.rates.target-currencies}")
    private String targetCurrencies;

    // Internal record to deserialize Frankfurter API response
    private record FrankfurterResponse(String base, Map<String, BigDecimal> rates) {}

    @Transactional
    public void fetchAndStore() {
        log.info("Fetching exchange rates from Frankfurter API");
        try {
            FrankfurterResponse response = restClient.get()
                    .uri("/latest?from={base}&to={targets}", baseCurrency, targetCurrencies)
                    .retrieve()
                    .body(FrankfurterResponse.class);

            if (response == null || response.rates() == null || response.rates().isEmpty()) {
                log.warn("Empty response from Frankfurter API, skipping update");
                return;
            }

            Instant now = Instant.now();
            exchangeRateRepository.deleteAll();

            List<ExchangeRate> fresh = response.rates().entrySet().stream()
                    .map(entry -> ExchangeRate.builder()
                            .baseCurrency(baseCurrency)
                            .targetCurrency(entry.getKey())
                            .rate(entry.getValue())
                            .fetchedAt(now)
                            .build())
                    .toList();

            exchangeRateRepository.saveAll(fresh);
            log.info("Stored {} exchange rates (base: {})", fresh.size(), baseCurrency);
        } catch (Exception e) {
            log.error("Failed to fetch exchange rates: {}", e.getMessage());
        }
    }

    @Transactional
    public RateResponse getLatestRates() {
        List<ExchangeRate> rows = exchangeRateRepository.findAll();
        if (rows.isEmpty()) {
            fetchAndStore();
            rows = exchangeRateRepository.findAll();
        }

        Instant fetchedAt = rows.stream()
                .map(ExchangeRate::getFetchedAt)
                .max(Instant::compareTo)
                .orElse(Instant.now());

        Map<String, BigDecimal> rates = rows.stream()
                .collect(Collectors.toMap(ExchangeRate::getTargetCurrency, ExchangeRate::getRate));

        return new RateResponse(baseCurrency, rates, fetchedAt);
    }

    /**
     * Convert amount from one currency to another using cached EUR-based rates.
     * Supports EUR, TRY, USD. Conversion path: X → EUR → Y.
     */
    public BigDecimal convert(BigDecimal amount, String from, String to) {
        if (from.equals(to)) return amount;

        List<ExchangeRate> rows = exchangeRateRepository.findAll();
        Map<String, BigDecimal> eurRates = rows.stream()
                .collect(Collectors.toMap(ExchangeRate::getTargetCurrency, ExchangeRate::getRate));

        // Convert `from` → EUR
        BigDecimal amountInEur;
        if (from.equals(baseCurrency)) {
            amountInEur = amount;
        } else {
            BigDecimal fromRate = eurRates.get(from);
            if (fromRate == null) throw new IllegalArgumentException("No rate for currency: " + from);
            amountInEur = amount.divide(fromRate, 10, RoundingMode.HALF_UP);
        }

        // Convert EUR → `to`
        if (to.equals(baseCurrency)) return amountInEur.setScale(4, RoundingMode.HALF_UP);

        BigDecimal toRate = eurRates.get(to);
        if (toRate == null) throw new IllegalArgumentException("No rate for currency: " + to);
        return amountInEur.multiply(toRate).setScale(4, RoundingMode.HALF_UP);
    }
}
