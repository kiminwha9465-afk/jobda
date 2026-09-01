package com.example.jobda.domain.enums;

public enum ScheduleType {
    DEADLINE("마감일"),
    TEST("필기시험"),
    INTERVIEW_1("1차면접"),
    INTERVIEW_2("2차면접"),
    INTERVIEW_FINAL("최종면접"),
    CODING_TEST("코딩테스트"),
    PERSONAL("개인일정"),
    ETC("기타");

    private final String label;

    ScheduleType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
