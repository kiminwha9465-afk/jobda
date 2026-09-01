package com.example.jobda.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CompanyRequest(
        @NotBlank(message = "기업명은 필수입니다")
        String name,
        String industry,
        String location,
        String website,
        String size,
        String welfare,
        String memo
) {}
