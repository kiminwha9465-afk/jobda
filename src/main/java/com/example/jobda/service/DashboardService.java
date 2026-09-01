package com.example.jobda.service;

import com.example.jobda.domain.enums.ApplicationStatus;
import com.example.jobda.dto.response.DashboardResponse;
import com.example.jobda.dto.response.JobPostingResponse;
import com.example.jobda.dto.response.ScheduleResponse;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final JobPostingRepository jobPostingRepository;
    private final ScheduleRepository scheduleRepository;

    public DashboardResponse getDashboard() {
        long totalPostings = jobPostingRepository.count();

        long finishedPostings = jobPostingRepository.countByStatus(ApplicationStatus.FINAL_PASS)
                + jobPostingRepository.countByStatus(ApplicationStatus.REJECTED)
                + jobPostingRepository.countByStatus(ApplicationStatus.WITHDRAWN);
        long activePostings = totalPostings - finishedPostings;

        long interviewCount = jobPostingRepository.countByStatus(ApplicationStatus.INTERVIEW_1)
                + jobPostingRepository.countByStatus(ApplicationStatus.INTERVIEW_2);

        long appliedCount = jobPostingRepository.countByStatus(ApplicationStatus.APPLIED);
        long documentPassCount = jobPostingRepository.countByStatus(ApplicationStatus.DOCUMENT_PASS)
                + jobPostingRepository.countByStatus(ApplicationStatus.INTERVIEW_1)
                + jobPostingRepository.countByStatus(ApplicationStatus.INTERVIEW_2)
                + jobPostingRepository.countByStatus(ApplicationStatus.FINAL_PASS);
        double documentPassRate = appliedCount + documentPassCount > 0
                ? (double) documentPassCount / (appliedCount + documentPassCount) * 100
                : 0.0;

        Map<String, Long> statusSummary = Arrays.stream(ApplicationStatus.values())
                .collect(Collectors.toMap(
                        ApplicationStatus::getLabel,
                        jobPostingRepository::countByStatus
                ));

        List<ScheduleResponse> upcomingSchedules = scheduleRepository
                .findUpcoming(LocalDateTime.now())
                .stream()
                .limit(5)
                .map(ScheduleResponse::from)
                .toList();

        List<JobPostingResponse> upcomingDeadlines = jobPostingRepository
                .findUpcomingDeadlines(LocalDate.now())
                .stream()
                .limit(5)
                .map(JobPostingResponse::from)
                .toList();

        return new DashboardResponse(
                totalPostings,
                activePostings,
                interviewCount,
                Math.round(documentPassRate * 10.0) / 10.0,
                statusSummary,
                upcomingSchedules,
                upcomingDeadlines
        );
    }
}
