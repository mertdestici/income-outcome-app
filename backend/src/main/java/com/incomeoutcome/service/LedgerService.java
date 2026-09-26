package com.incomeoutcome.service;

import com.incomeoutcome.dto.*;
import com.incomeoutcome.entity.*;
import com.incomeoutcome.exception.ConflictException;
import com.incomeoutcome.exception.ResourceNotFoundException;
import com.incomeoutcome.repository.ExpenseRepository;
import com.incomeoutcome.repository.LedgerOptionRepository;
import com.incomeoutcome.repository.NoSpendDayRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Nightly Ledger: per-day logging with card / category, explicit no-spend days,
 * and a month rollup (totals by card, by category, every expense, missing days).
 */
@Service
@RequiredArgsConstructor
public class LedgerService {

    static final String NO_CARD     = "Unassigned";
    static final String NO_CATEGORY = "Uncategorised";

    private final ExpenseRepository expenseRepository;
    private final NoSpendDayRepository noSpendDayRepository;
    private final LedgerOptionRepository ledgerOptionRepository;
    private final ExpenseService expenseService;

    public static LocalDate today(User user) {
        return LocalDate.now(ZoneId.of(user.getTimezone()));
    }

    // ── Cards & categories ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LedgerOptionsResponse getOptions(User user) {
        List<LedgerOptionResponse> all = ledgerOptionRepository.findByUserOrderByNameAsc(user).stream()
                .map(o -> new LedgerOptionResponse(o.getId(), o.getKind(), o.getName()))
                .toList();
        return new LedgerOptionsResponse(
                all.stream().filter(o -> o.kind() == LedgerOptionKind.CARD).toList(),
                all.stream().filter(o -> o.kind() == LedgerOptionKind.CATEGORY).toList());
    }

    @Transactional
    public LedgerOptionResponse addOption(CreateLedgerOptionRequest request, User user) {
        String name = request.name().trim();
        if (ledgerOptionRepository.existsByUserAndKindAndNameIgnoreCase(user, request.kind(), name)) {
            throw new ConflictException("'" + name + "' already exists");
        }
        LedgerOption saved = ledgerOptionRepository.save(LedgerOption.builder()
                .user(user)
                .kind(request.kind())
                .name(name)
                .build());
        return new LedgerOptionResponse(saved.getId(), saved.getKind(), saved.getName());
    }

    /** Removes the option from the pick list only; logged expenses keep the name. */
    @Transactional
    public void deleteOption(UUID id, User user) {
        LedgerOption option = ledgerOptionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Option not found"));
        ledgerOptionRepository.delete(option);
    }

    // ── Day ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LedgerDayResponse getDay(LocalDate date, User user) {
        List<Expense> expenses = expenseRepository.findByUserAndDateBetweenOrderByDateAscCreatedAtAsc(user, date, date);
        return new LedgerDayResponse(
                date,
                expenses.stream().map(expenseService::toResponse).toList(),
                noSpendDayRepository.existsByUserAndDate(user, date),
                totalsByCurrency(expenses));
    }

    @Transactional
    public LedgerDayResponse markNoSpend(LocalDate date, User user) {
        if (expenseRepository.existsByUserAndDate(user, date)) {
            throw new ConflictException("This day already has expenses logged");
        }
        if (!noSpendDayRepository.existsByUserAndDate(user, date)) {
            noSpendDayRepository.save(NoSpendDay.builder().user(user).date(date).build());
        }
        return getDay(date, user);
    }

    @Transactional
    public LedgerDayResponse clearNoSpend(LocalDate date, User user) {
        noSpendDayRepository.deleteByUserAndDate(user, date);
        return getDay(date, user);
    }

    // ── Month ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public LedgerMonthResponse getMonth(YearMonth month, User user) {
        LocalDate from = month.atDay(1);
        LocalDate to   = month.atEndOfMonth();

        List<Expense> expenses = expenseRepository.findByUserAndDateBetweenOrderByDateAscCreatedAtAsc(user, from, to);
        Map<Currency, BigDecimal> totals = totalsByCurrency(expenses);

        Set<LocalDate> noSpend = noSpendDayRepository.findByUserAndDateBetween(user, from, to).stream()
                .map(NoSpendDay::getDate)
                .collect(Collectors.toCollection(TreeSet::new));
        Set<LocalDate> logged = expenses.stream().map(Expense::getDate).collect(Collectors.toSet());

        // A day is "missing" once it has started (in the user's timezone), is on or after
        // sign-up, and has neither an expense nor an explicit no-spend mark.
        LocalDate today = today(user);
        LocalDate signUp = user.getCreatedAt() != null
                ? LocalDate.ofInstant(user.getCreatedAt(), ZoneId.of(user.getTimezone()))
                : from;
        LocalDate first = signUp.isAfter(from) ? signUp : from;
        LocalDate last  = today.isBefore(to) ? today : to;
        List<LocalDate> missing = new ArrayList<>();
        for (LocalDate d = first; !d.isAfter(last); d = d.plusDays(1)) {
            if (!logged.contains(d) && !noSpend.contains(d)) missing.add(d);
        }

        return new LedgerMonthResponse(
                month.getYear(),
                month.getMonthValue(),
                totals,
                rollup(expenses, e -> Objects.requireNonNullElse(e.getCard(), NO_CARD), totals),
                rollup(expenses, e -> Objects.requireNonNullElse(e.getCategory(), NO_CATEGORY), totals),
                expenses.stream().map(expenseService::toResponse).toList(),
                List.copyOf(noSpend),
                missing);
    }

    private static Map<Currency, BigDecimal> totalsByCurrency(List<Expense> expenses) {
        Map<Currency, BigDecimal> totals = new EnumMap<>(Currency.class);
        for (Expense e : expenses) totals.merge(e.getCurrency(), e.getAmount(), BigDecimal::add);
        return totals;
    }

    /** Groups by (label, currency); rows sorted by currency, then total descending. */
    private static List<LedgerTotalRow> rollup(List<Expense> expenses, Function<Expense, String> label,
                                               Map<Currency, BigDecimal> totals) {
        record Key(String label, Currency currency) {}
        Map<Key, BigDecimal> sums   = new HashMap<>();
        Map<Key, Long>       counts = new HashMap<>();
        for (Expense e : expenses) {
            Key k = new Key(label.apply(e), e.getCurrency());
            sums.merge(k, e.getAmount(), BigDecimal::add);
            counts.merge(k, 1L, Long::sum);
        }
        return sums.entrySet().stream()
                .map(en -> {
                    BigDecimal currencyTotal = totals.get(en.getKey().currency());
                    BigDecimal share = currencyTotal == null || currencyTotal.signum() == 0
                            ? BigDecimal.ZERO
                            : en.getValue().multiply(BigDecimal.valueOf(100))
                                    .divide(currencyTotal, 1, RoundingMode.HALF_UP);
                    return new LedgerTotalRow(en.getKey().label(), en.getKey().currency(),
                            en.getValue(), counts.get(en.getKey()), share);
                })
                .sorted(Comparator.comparing(LedgerTotalRow::currency)
                        .thenComparing(LedgerTotalRow::total, Comparator.reverseOrder()))
                .toList();
    }
}
