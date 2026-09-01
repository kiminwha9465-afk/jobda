package com.example.jobda.dto.response;

import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.enums.ApplicationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public record JobPostingResponse(
        Long id,
        String title,
        Long companyId,
        String companyName,
        String url,
        LocalDate deadline,
        ApplicationStatus status,
        String statusLabel,
        String jobType,
        String department,
        String memo,
        Set<TagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static JobPostingResponse from(JobPosting jp) {
        return new JobPostingResponse(
                jp.getId(),
                jp.getTitle(),
                jp.getCompany() != null ? jp.getCompany().getId() : null,
                jp.getCompany() != null ? jp.getCompany().getName() : null,
                jp.getUrl(),
                jp.getDeadline(),
                jp.getStatus(),
                jp.getStatus().getLabel(),
                jp.getJobType(),
                jp.getDepartment(),
                jp.getMemo(),
                jp.getTags().stream().map(TagResponse::from).collect(Collectors.toSet()),
                jp.getCreatedAt(),
                jp.getUpdatedAt()
        );
    }
}
