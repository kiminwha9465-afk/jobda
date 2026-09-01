package com.example.jobda.dto.response;

import java.util.List;

public record SearchResponse(
        String keyword,
        int totalCount,
        List<CompanyResponse> companies,
        List<JobPostingResponse> jobPostings,
        List<CoverLetterResponse> coverLetters,
        List<ResumeResponse> resumes
) {}
