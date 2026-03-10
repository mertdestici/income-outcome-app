package com.incomeoutcome.service;

import com.incomeoutcome.dto.UpdateSettingsRequest;
import com.incomeoutcome.dto.UserSettingsResponse;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserSettingsService {

    private final UserRepository userRepository;

    public UserSettingsResponse getSettings(User user) {
        return new UserSettingsResponse(user.getReportEmail());
    }

    @Transactional
    public UserSettingsResponse updateSettings(UpdateSettingsRequest req, User user) {
        user.setReportEmail(req.reportEmail());
        userRepository.save(user);
        return new UserSettingsResponse(user.getReportEmail());
    }
}
