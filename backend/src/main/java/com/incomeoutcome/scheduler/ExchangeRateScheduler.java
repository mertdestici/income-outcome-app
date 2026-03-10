package com.incomeoutcome.scheduler;

import com.incomeoutcome.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class ExchangeRateScheduler {

    private final ExchangeRateService exchangeRateService;

    // Daily at 08:00 server time — ECB publishes previous day's rates overnight
    @Scheduled(cron = "0 0 8 * * *")
    public void refreshRates() {
        log.info("Scheduled exchange rate refresh triggered");
        exchangeRateService.fetchAndStore();
    }
}
