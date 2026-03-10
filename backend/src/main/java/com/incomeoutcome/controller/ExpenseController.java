package com.incomeoutcome.controller;

import com.incomeoutcome.dto.CreateExpenseRequest;
import com.incomeoutcome.dto.ExpenseResponse;
import com.incomeoutcome.dto.UpdateExpenseRequest;
import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.DocumentType;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    public ResponseEntity<ExpenseResponse> create(@Valid @RequestBody CreateExpenseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.create(request, currentUser()));
    }

    @GetMapping
    public Page<ExpenseResponse> list(
            @RequestParam(required = false) Currency currency,
            @RequestParam(required = false) DocumentType documentType,
            @RequestParam(required = false) Integer month,
            @RequestParam(required = false) Integer year,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "date,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParts[0]));
        return expenseService.list(currentUser(), currency, documentType, month, year, pageable);
    }

    @PutMapping("/{id}")
    public ExpenseResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateExpenseRequest request) {
        return expenseService.update(id, request, currentUser());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        expenseService.delete(id, currentUser());
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
