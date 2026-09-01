package com.example.jobda.dto.request;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CoverLetterRequest(
        @NotBlank(message = "자소서 제목은 필수입니다")
        String title,
        Long companyId,
        String targetPosition,
        Integer version,
        List<CoverLetterItemRequest> items
) {}
