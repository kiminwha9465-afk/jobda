package com.example.jobda.service;

import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ApplicationStatus;
import com.example.jobda.dto.response.DashboardResponse;
import com.example.jobda.dto.response.JobPostingResponse;
import com.example.jobda.dto.response.ScheduleResponse;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.ScheduleRepository;
import com.example.jobda.util.AuthUtil;
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
    private final AuthUtil authUtil;

    public DashboardResponse getDashboard() {
        User user = authUtil.getCurrentUser();

        long totalPostings = jobPostingRepository.countByUser(user);

        long finishedPostings = jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.FINAL_PASS)
                + jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.REJECTED)
                + jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.WITHDRAWN);
        long activePostings = totalPostings - finishedPostings;

        long interviewCount = jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.INTERVIEW_1)
                + jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.INTERVIEW_2);

        long appliedCount = jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.APPLIED);
        long documentPassCount = jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.DOCUMENT_PASS)
                + jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.INTERVIEW_1)
                + jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.INTERVIEW_2)
                + jobPostingRepository.countByUserAndStatus(user, ApplicationStatus.FINAL_PASS);
        double documentPassRate = appliedCount + documentPassCount > 0
                ? (double) documentPassCount / (appliedCount + documentPassCount) * 100
                : 0.0;

        Map<String, Long> statusSummary = Arrays.stream(ApplicationStatus.values())
                .collect(Collectors.toMap(
                        ApplicationStatus::getLabel,
                        status -> jobPostingRepository.countByUserAndStatus(user, status)
                ));

        List<ScheduleResponse> upcomingSchedules = scheduleRepository
                .findUpcomingByUser(user, LocalDateTime.now())
                .stream()
                .limit(5)
                .map(ScheduleResponse::from)
                .toList();

        List<JobPostingResponse> upcomingDeadlines = jobPostingRepository
                .findUpcomingDeadlinesByUser(user, LocalDate.now())
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
