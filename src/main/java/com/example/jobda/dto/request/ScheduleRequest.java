package com.example.jobda.dto.request;

import com.example.jobda.domain.enums.ScheduleType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;

public record ScheduleRequest(
        @NotBlank(message = "일정 제목은 필수입니다")
        String title,
        @NotNull(message = "일정 유형은 필수입니다")
        ScheduleType type,
        @NotNull(message = "일정 날짜/시간은 필수입니다")
        LocalDateTime scheduledAt,
        String location,
        String memo,
        Long jobPostingId
) {}
