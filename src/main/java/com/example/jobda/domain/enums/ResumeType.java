package com.example.jobda.domain.enums;

public enum ResumeType {
    RESUME("이력서"),
    PORTFOLIO("포트폴리오");

    private final String label;

    ResumeType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
