package com.incomeoutcome.controller;

import com.incomeoutcome.dto.RateResponse;
import com.incomeoutcome.service.ExchangeRateService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rates")
@RequiredArgsConstructor
public class RateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping
    public RateResponse getRates() {
        return exchangeRateService.getLatestRates();
    }
}
