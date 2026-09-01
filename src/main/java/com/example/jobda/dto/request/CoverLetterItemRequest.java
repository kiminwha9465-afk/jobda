package com.example.jobda.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CoverLetterItemRequest(
        @NotBlank(message = "문항 내용은 필수입니다")
        String question,
        String answer,
        Integer charLimit,
        Integer orderIndex
) {}
