package com.example.jobda.repository;

import com.example.jobda.domain.entity.Schedule;
import com.example.jobda.domain.enums.ScheduleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {
    List<Schedule> findByJobPostingId(Long jobPostingId);
    List<Schedule> findByType(ScheduleType type);
    List<Schedule> findByCompleted(boolean completed);

    @Query("SELECT s FROM Schedule s WHERE s.scheduledAt BETWEEN :start AND :end ORDER BY s.scheduledAt ASC")
    List<Schedule> findByScheduledAtBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT s FROM Schedule s WHERE s.scheduledAt >= :now AND s.completed = false ORDER BY s.scheduledAt ASC")
    List<Schedule> findUpcoming(LocalDateTime now);
}
