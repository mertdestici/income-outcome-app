package com.incomeoutcome.controller;

import com.incomeoutcome.dto.UpdateSettingsRequest;
import com.incomeoutcome.dto.UserSettingsResponse;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.service.UserSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@RequiredArgsConstructor
public class SettingsController {

    private final UserSettingsService userSettingsService;

    @GetMapping
    public ResponseEntity<UserSettingsResponse> getSettings() {
        return ResponseEntity.ok(userSettingsService.getSettings(currentUser()));
    }

    @PutMapping
    public ResponseEntity<UserSettingsResponse> updateSettings(@Valid @RequestBody UpdateSettingsRequest req) {
        return ResponseEntity.ok(userSettingsService.updateSettings(req, currentUser()));
    }

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
