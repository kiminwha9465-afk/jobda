package com.example.jobda.dto.request;

import com.example.jobda.domain.enums.ApplicationStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record JobPostingRequest(
        @NotBlank(message = "공고 제목은 필수입니다")
        String title,
        Long companyId,
        String url,
        LocalDate deadline,
        ApplicationStatus status,
        String jobType,
        String department,
        String memo
) {}
