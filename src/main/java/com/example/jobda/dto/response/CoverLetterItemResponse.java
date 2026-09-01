package com.example.jobda.dto.response;

import com.example.jobda.domain.entity.CoverLetterItem;

public record CoverLetterItemResponse(
        Long id,
        String question,
        String answer,
        Integer charLimit,
        Integer orderIndex,
        int currentLength
) {
    public static CoverLetterItemResponse from(CoverLetterItem item) {
        int length = item.getAnswer() != null ? item.getAnswer().length() : 0;
        return new CoverLetterItemResponse(
                item.getId(),
                item.getQuestion(),
                item.getAnswer(),
                item.getCharLimit(),
                item.getOrderIndex(),
                length
        );
    }
}
