package com.example.jobda.dto.request;

import jakarta.validation.constraints.NotBlank;

public record TagRequest(
        @NotBlank(message = "태그명은 필수입니다")
        String name,
        String color
) {}
