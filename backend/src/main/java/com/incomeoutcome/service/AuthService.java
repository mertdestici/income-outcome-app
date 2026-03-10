package com.incomeoutcome.service;

import com.incomeoutcome.dto.AuthResponse;
import com.incomeoutcome.dto.LoginRequest;
import com.incomeoutcome.dto.RegisterRequest;
import com.incomeoutcome.entity.RevokedToken;
import com.incomeoutcome.entity.User;
import com.incomeoutcome.exception.EmailAlreadyExistsException;
import com.incomeoutcome.repository.RevokedTokenRepository;
import com.incomeoutcome.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new EmailAlreadyExistsException(request.email());
        }
        User user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();
        userRepository.save(user);
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getEmail());
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmail(request.email()).orElseThrow();
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, user.getEmail());
    }

    public void logout(String token) {
        RevokedToken revoked = RevokedToken.builder()
                .jti(jwtService.extractJti(token))
                .revokedAt(Instant.now())
                .expiresAt(jwtService.extractExpiration(token))
                .build();
        revokedTokenRepository.save(revoked);
    }
}
