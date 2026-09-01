package com.example.jobda.domain.enums;

public enum ApplicationStatus {
    INTERESTED("관심"),
    PLAN_TO_APPLY("지원예정"),
    APPLIED("지원완료"),
    DOCUMENT_PASS("서류합격"),
    INTERVIEW_1("1차면접"),
    INTERVIEW_2("2차면접"),
    FINAL_PASS("최종합격"),
    REJECTED("불합격"),
    WITHDRAWN("취소");

    private final String label;

    ApplicationStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
