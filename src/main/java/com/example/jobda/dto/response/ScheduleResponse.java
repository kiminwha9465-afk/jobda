package com.example.jobda.dto.response;

import com.example.jobda.domain.entity.Schedule;
import com.example.jobda.domain.enums.ScheduleType;

import java.time.LocalDateTime;

public record ScheduleResponse(
        Long id,
        String title,
        ScheduleType type,
        String typeLabel,
        LocalDateTime scheduledAt,
        String location,
        String memo,
        boolean completed,
        Long jobPostingId,
        String jobPostingTitle,
        String companyName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ScheduleResponse from(Schedule schedule) {
        String jobPostingTitle = null;
        String companyName = null;
        Long jobPostingId = null;

        if (schedule.getJobPosting() != null) {
            jobPostingId = schedule.getJobPosting().getId();
            jobPostingTitle = schedule.getJobPosting().getTitle();
            if (schedule.getJobPosting().getCompany() != null) {
                companyName = schedule.getJobPosting().getCompany().getName();
            }
        }

        return new ScheduleResponse(
                schedule.getId(),
                schedule.getTitle(),
                schedule.getType(),
                schedule.getType().getLabel(),
                schedule.getScheduledAt(),
                schedule.getLocation(),
                schedule.getMemo(),
                schedule.isCompleted(),
                jobPostingId,
                jobPostingTitle,
                companyName,
                schedule.getCreatedAt(),
                schedule.getUpdatedAt()
        );
    }
}
