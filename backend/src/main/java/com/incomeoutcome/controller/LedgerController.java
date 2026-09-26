package com.incomeoutcome.controller;

import com.incomeoutcome.dto.*;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.BadRequestException;
import com.incomeoutcome.service.LedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.UUID;

@RestController
@RequestMapping("/api/ledger")
@RequiredArgsConstructor
public class LedgerController {

    private final LedgerService ledgerService;

    @GetMapping("/options")
    public LedgerOptionsResponse options() {
        return ledgerService.getOptions(currentUser());
    }

    @PostMapping("/options")
    public ResponseEntity<LedgerOptionResponse> addOption(@Valid @RequestBody CreateLedgerOptionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ledgerService.addOption(request, currentUser()));
    }

    @DeleteMapping("/options/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteOption(@PathVariable UUID id) {
        ledgerService.deleteOption(id, currentUser());
    }

    @GetMapping("/day/{date}")
    public LedgerDayResponse day(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ledgerService.getDay(date, currentUser());
    }

    @PutMapping("/day/{date}/no-spend")
    public LedgerDayResponse markNoSpend(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ledgerService.markNoSpend(date, currentUser());
    }

    @DeleteMapping("/day/{date}/no-spend")
    public LedgerDayResponse clearNoSpend(@PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ledgerService.clearNoSpend(date, currentUser());
    }

    /** Defaults to the current month in the user's timezone. */
    @GetMapping("/month")
    public LedgerMonthResponse month(@RequestParam(required = false) Integer year,
                                     @RequestParam(required = false) Integer month) {
        User user = currentUser();
        YearMonth ym;
        try {
            ym = year != null && month != null
                    ? YearMonth.of(year, month)
                    : YearMonth.from(LedgerService.today(user));
        } catch (DateTimeException e) {
            throw new BadRequestException("Invalid year/month");
        }
        return ledgerService.getMonth(ym, user);
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
