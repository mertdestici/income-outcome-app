package com.incomeoutcome.controller;

import com.incomeoutcome.dto.CurrencyBreakdown;
import com.incomeoutcome.dto.MonthlyBreakdownItem;
import com.incomeoutcome.dto.SummaryResponse;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @GetMapping("/summary")
    public SummaryResponse summary() {
        return reportService.getSummary(currentUser());
    }

    @GetMapping("/monthly")
    public List<MonthlyBreakdownItem> monthly() {
        return reportService.getMonthlyBreakdown(currentUser());
    }

    @GetMapping("/by-currency")
    public List<CurrencyBreakdown> byCurrency() {
        return reportService.getByCurrency(currentUser());
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
