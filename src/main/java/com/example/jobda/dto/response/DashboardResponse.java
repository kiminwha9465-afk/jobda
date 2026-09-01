package com.example.jobda.dto.response;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        long totalPostings,
        long activePostings,
        long interviewCount,
        double documentPassRate,
        Map<String, Long> statusSummary,
        List<ScheduleResponse> upcomingSchedules,
        List<JobPostingResponse> upcomingDeadlines
) {}
