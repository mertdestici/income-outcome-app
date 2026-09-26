package com.incomeoutcome.service;

import com.incomeoutcome.dto.UpdateSettingsRequest;
import com.incomeoutcome.dto.UserSettingsResponse;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.BadRequestException;
import com.incomeoutcome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DateTimeException;
import java.time.ZoneId;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserRepository userRepository;

    public UserSettingsResponse getSettings(User user) {
        return toResponse(user);
    }

    @Transactional
    public UserSettingsResponse updateSettings(UpdateSettingsRequest req, User user) {
        user.setReportEmail(req.reportEmail());
        if (req.timezone() != null) {
            try {
                user.setTimezone(ZoneId.of(req.timezone()).getId());
            } catch (DateTimeException e) {
                throw new BadRequestException("Unknown timezone: " + req.timezone());
            }
        }
        if (req.dailyReminderEnabled() != null) user.setDailyReminderEnabled(req.dailyReminderEnabled());
        if (req.monthlyLedgerEnabled() != null) user.setMonthlyLedgerEnabled(req.monthlyLedgerEnabled());
        userRepository.save(user);
        return toResponse(user);
    }

    private UserSettingsResponse toResponse(User user) {
        return new UserSettingsResponse(
                user.getReportEmail(),
                user.getTimezone(),
                user.isDailyReminderEnabled(),
                user.isMonthlyLedgerEnabled());
    }
}
