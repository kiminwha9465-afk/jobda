package com.example.jobda.dto.response;

import com.example.jobda.domain.entity.CoverLetter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

public record CoverLetterResponse(
        Long id,
        String title,
        Long companyId,
        String companyName,
        String targetPosition,
        Integer version,
        List<CoverLetterItemResponse> items,
        Set<TagResponse> tags,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CoverLetterResponse from(CoverLetter cl) {
        return new CoverLetterResponse(
                cl.getId(),
                cl.getTitle(),
                cl.getCompany() != null ? cl.getCompany().getId() : null,
                cl.getCompany() != null ? cl.getCompany().getName() : null,
                cl.getTargetPosition(),
                cl.getVersion(),
                cl.getItems().stream().map(CoverLetterItemResponse::from).toList(),
                cl.getTags().stream().map(TagResponse::from).collect(Collectors.toSet()),
                cl.getCreatedAt(),
                cl.getUpdatedAt()
        );
    }
}
