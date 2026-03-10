package com.incomeoutcome.service;

import com.incomeoutcome.dto.CurrencyBreakdown;
import com.incomeoutcome.dto.MonthlyBreakdownItem;
import com.incomeoutcome.dto.SummaryResponse;
import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.ExpenseRepository;
import com.incomeoutcome.repository.IncomeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final ExchangeRateService exchangeRateService;

    @Transactional(readOnly = true)
    public SummaryResponse getSummary(User user) {
        Map<String, BigDecimal> incomeByC = toAmountMap(incomeRepository.sumAndCountByCurrency(user));
        Map<String, BigDecimal> expenseByC = toAmountMap(expenseRepository.sumAndCountByCurrency(user));

        // Net per currency across all known currencies
        Set<String> allCurrencies = new LinkedHashSet<>();
        allCurrencies.addAll(incomeByC.keySet());
        allCurrencies.addAll(expenseByC.keySet());

        Map<String, BigDecimal> netByC = new LinkedHashMap<>();
        for (String c : allCurrencies) {
            BigDecimal inc = incomeByC.getOrDefault(c, BigDecimal.ZERO);
            BigDecimal exp = expenseByC.getOrDefault(c, BigDecimal.ZERO);
            netByC.put(c, inc.subtract(exp));
        }

        // Convert all totals to EUR
        BigDecimal totalIncomeEur = incomeByC.entrySet().stream()
                .map(e -> exchangeRateService.convert(e.getValue(), e.getKey(), "EUR"))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);

        BigDecimal totalExpenseEur = expenseByC.entrySet().stream()
                .map(e -> exchangeRateService.convert(e.getValue(), e.getKey(), "EUR"))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(4, RoundingMode.HALF_UP);

        return new SummaryResponse(
                incomeByC,
                expenseByC,
                netByC,
                totalIncomeEur,
                totalExpenseEur,
                totalIncomeEur.subtract(totalExpenseEur)
        );
    }

    @Transactional(readOnly = true)
    public List<MonthlyBreakdownItem> getMonthlyBreakdown(User user) {
        // Key: "year-month-currency"
        record Key(int year, int month, String currency) {}

        Map<Key, BigDecimal> incomeMap = new LinkedHashMap<>();
        for (Object[] row : incomeRepository.monthlySum(user)) {
            Key k = new Key(toInt(row[0]), toInt(row[1]), currencyName(row[2]));
            incomeMap.put(k, (BigDecimal) row[3]);
        }

        Map<Key, BigDecimal> expenseMap = new LinkedHashMap<>();
        for (Object[] row : expenseRepository.monthlySum(user)) {
            Key k = new Key(toInt(row[0]), toInt(row[1]), currencyName(row[2]));
            expenseMap.put(k, (BigDecimal) row[3]);
        }

        Set<Key> allKeys = new LinkedHashSet<>();
        allKeys.addAll(incomeMap.keySet());
        allKeys.addAll(expenseMap.keySet());

        List<MonthlyBreakdownItem> result = new ArrayList<>();
        for (Key k : allKeys) {
            BigDecimal inc = incomeMap.getOrDefault(k, BigDecimal.ZERO);
            BigDecimal exp = expenseMap.getOrDefault(k, BigDecimal.ZERO);
            result.add(new MonthlyBreakdownItem(k.year(), k.month(), k.currency(), inc, exp, inc.subtract(exp)));
        }

        // Sort newest first
        result.sort(Comparator.comparingInt(MonthlyBreakdownItem::year)
                .thenComparingInt(MonthlyBreakdownItem::month)
                .reversed());

        return result;
    }

    @Transactional(readOnly = true)
    public List<CurrencyBreakdown> getByCurrency(User user) {
        Map<String, BigDecimal> incomeAmounts = new LinkedHashMap<>();
        Map<String, Long>       incomeCounts  = new LinkedHashMap<>();
        for (Object[] row : incomeRepository.sumAndCountByCurrency(user)) {
            String c = currencyName(row[0]);
            incomeAmounts.put(c, (BigDecimal) row[1]);
            incomeCounts.put(c, ((Number) row[2]).longValue());
        }

        Map<String, BigDecimal> expenseAmounts = new LinkedHashMap<>();
        Map<String, Long>       expenseCounts  = new LinkedHashMap<>();
        for (Object[] row : expenseRepository.sumAndCountByCurrency(user)) {
            String c = currencyName(row[0]);
            expenseAmounts.put(c, (BigDecimal) row[1]);
            expenseCounts.put(c, ((Number) row[2]).longValue());
        }

        Set<String> all = new LinkedHashSet<>();
        all.addAll(incomeAmounts.keySet());
        all.addAll(expenseAmounts.keySet());

        return all.stream().map(c -> {
            BigDecimal inc = incomeAmounts.getOrDefault(c, BigDecimal.ZERO);
            BigDecimal exp = expenseAmounts.getOrDefault(c, BigDecimal.ZERO);
            return new CurrencyBreakdown(
                    c, inc, exp, inc.subtract(exp),
                    incomeCounts.getOrDefault(c, 0L),
                    expenseCounts.getOrDefault(c, 0L)
            );
        }).toList();
    }

    // --- helpers ---

    private Map<String, BigDecimal> toAmountMap(List<Object[]> rows) {
        Map<String, BigDecimal> map = new LinkedHashMap<>();
        for (Object[] row : rows) {
            map.put(currencyName(row[0]), (BigDecimal) row[1]);
        }
        return map;
    }

    private String currencyName(Object raw) {
        return raw instanceof Currency c ? c.name() : raw.toString();
    }

    private int toInt(Object raw) {
        return ((Number) raw).intValue();
    }
}
