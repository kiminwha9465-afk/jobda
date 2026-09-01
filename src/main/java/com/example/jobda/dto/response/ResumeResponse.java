package com.example.jobda.dto.response;

import com.example.jobda.domain.entity.Resume;
import com.example.jobda.domain.enums.ResumeType;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public record ResumeResponse(
        Long id,
        String title,
        ResumeType type,
        String typeLabel,
        String content,
        String targetCompany,
        String targetPosition,
        Integer version,
        boolean isTemplate,
        String fileUrl,
        String originalFileName,
        Set<TagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ResumeResponse from(Resume resume) {
        return new ResumeResponse(
                resume.getId(),
                resume.getTitle(),
                resume.getType(),
                resume.getType().getLabel(),
                resume.getContent(),
                resume.getTargetCompany(),
                resume.getTargetPosition(),
                resume.getVersion(),
                resume.isTemplate(),
                resume.getFileUrl(),
                resume.getOriginalFileName(),
                resume.getTags().stream().map(TagResponse::from).collect(Collectors.toSet()),
                resume.getCreatedAt(),
                resume.getUpdatedAt()
        );
    }
}
