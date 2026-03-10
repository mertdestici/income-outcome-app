package com.incomeoutcome.controller;

import com.incomeoutcome.dto.CreateIncomeRequest;
import com.incomeoutcome.dto.IncomeResponse;
import com.incomeoutcome.dto.UpdateIncomeRequest;
import com.incomeoutcome.entity.Currency;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.service.IncomeService;
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

import java.time.Instant;
import java.util.UUID;

@RestController
@RequestMapping("/api/incomes")
@RequiredArgsConstructor
public class IncomeController {

    private final IncomeService incomeService;

    @PostMapping
    public ResponseEntity<IncomeResponse> create(@Valid @RequestBody CreateIncomeRequest request) {
        User user = currentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(incomeService.create(request, user));
    }

    @GetMapping
    public Page<IncomeResponse> list(
            @RequestParam(required = false) Currency currency,
            @RequestParam(required = false) Instant from,
            @RequestParam(required = false) Instant to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort
    ) {
        String[] sortParts = sort.split(",");
        Sort.Direction direction = sortParts.length > 1 && sortParts[1].equalsIgnoreCase("asc")
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortParts[0]));
        return incomeService.list(currentUser(), currency, from, to, pageable);
    }

    @PutMapping("/{id}")
    public IncomeResponse update(@PathVariable UUID id, @Valid @RequestBody UpdateIncomeRequest request) {
        return incomeService.update(id, request, currentUser());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id) {
        incomeService.delete(id, currentUser());
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
