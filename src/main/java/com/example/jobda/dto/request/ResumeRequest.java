package com.example.jobda.dto.request;

import com.example.jobda.domain.enums.ResumeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResumeRequest(
        @NotBlank(message = "제목은 필수입니다")
        String title,
        @NotNull(message = "문서 유형은 필수입니다")
        ResumeType type,
        String content,
        String targetCompany,
        String targetPosition,
        Integer version,
        boolean isTemplate
) {}
