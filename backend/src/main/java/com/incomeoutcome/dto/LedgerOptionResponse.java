package com.incomeoutcome.dto;

import com.incomeoutcome.entity.LedgerOptionKind;

import java.util.UUID;

public record LedgerOptionResponse(UUID id, LedgerOptionKind kind, String name) {}
