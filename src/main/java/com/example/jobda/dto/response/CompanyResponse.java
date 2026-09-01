package com.example.jobda.dto.response;

import com.example.jobda.domain.entity.Company;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

public record CompanyResponse(
        Long id,
        String name,
        String industry,
        String location,
        String website,
        String size,
        String welfare,
        String memo,
        Set<TagResponse> tags,
        int jobPostingCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CompanyResponse from(Company company) {
        return new CompanyResponse(
                company.getId(),
                company.getName(),
                company.getIndustry(),
                company.getLocation(),
                company.getWebsite(),
                company.getSize(),
                company.getWelfare(),
                company.getMemo(),
                company.getTags().stream().map(TagResponse::from).collect(Collectors.toSet()),
                company.getJobPostings().size(),
                company.getCreatedAt(),
                company.getUpdatedAt()
        );
    }
}
