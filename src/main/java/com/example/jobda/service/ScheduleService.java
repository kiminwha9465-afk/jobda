package com.example.jobda.service;

import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.entity.Schedule;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ScheduleType;
import com.example.jobda.dto.request.ScheduleRequest;
import com.example.jobda.dto.response.ScheduleResponse;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.ScheduleRepository;
import com.example.jobda.util.AuthUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final JobPostingRepository jobPostingRepository;
    private final AuthUtil authUtil;

    public List<ScheduleResponse> findAll() {
        User user = authUtil.getCurrentUser();
        return scheduleRepository.findByUser(user).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    public ScheduleResponse findById(Long id) {
        return ScheduleResponse.from(getSchedule(id));
    }

    public List<ScheduleResponse> findUpcoming() {
        User user = authUtil.getCurrentUser();
        return scheduleRepository.findUpcomingByUser(user, LocalDateTime.now()).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    public List<ScheduleResponse> findByType(ScheduleType type) {
        User user = authUtil.getCurrentUser();
        return scheduleRepository.findByUserAndType(user, type).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    public List<ScheduleResponse> findByJobPosting(Long jobPostingId) {
        User user = authUtil.getCurrentUser();
        return scheduleRepository.findByUserAndJobPostingId(user, jobPostingId).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    public List<ScheduleResponse> findByPeriod(LocalDateTime start, LocalDateTime end) {
        User user = authUtil.getCurrentUser();
        return scheduleRepository.findByUserAndPeriod(user, start, end).stream()
                .map(ScheduleResponse::from)
                .toList();
    }

    @Transactional
    public ScheduleResponse create(ScheduleRequest request) {
        User user = authUtil.getCurrentUser();
        JobPosting jobPosting = request.jobPostingId() != null
                ? jobPostingRepository.findById(request.jobPostingId())
                        .orElseThrow(() -> new EntityNotFoundException("공고를 찾을 수 없습니다"))
                : null;

        Schedule schedule = Schedule.builder()
                .title(request.title())
                .type(request.type())
                .scheduledAt(request.scheduledAt())
                .location(request.location())
                .memo(request.memo())
                .jobPosting(jobPosting)
                .user(user)
                .build();

        return ScheduleResponse.from(scheduleRepository.save(schedule));
    }

    @Transactional
    public ScheduleResponse update(Long id, ScheduleRequest request) {
        Schedule schedule = getSchedule(id);

        JobPosting jobPosting = request.jobPostingId() != null
                ? jobPostingRepository.findById(request.jobPostingId())
                        .orElseThrow(() -> new EntityNotFoundException("공고를 찾을 수 없습니다"))
                : null;

        schedule.setTitle(request.title());
        schedule.setType(request.type());
        schedule.setScheduledAt(request.scheduledAt());
        schedule.setLocation(request.location());
        schedule.setMemo(request.memo());
        schedule.setJobPosting(jobPosting);

        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public ScheduleResponse toggleComplete(Long id) {
        Schedule schedule = getSchedule(id);
        schedule.setCompleted(!schedule.isCompleted());
        return ScheduleResponse.from(schedule);
    }

    @Transactional
    public void delete(Long id) {
        scheduleRepository.deleteById(id);
    }

    private Schedule getSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("일정을 찾을 수 없습니다. id=" + id));
    }
}
