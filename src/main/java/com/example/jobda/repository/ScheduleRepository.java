package com.example.jobda.repository;

import com.example.jobda.domain.entity.Schedule;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ScheduleType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findByUser(User user);
    List<Schedule> findByUserAndJobPostingId(User user, Long jobPostingId);
    List<Schedule> findByUserAndType(User user, ScheduleType type);

    @Query("SELECT s FROM Schedule s WHERE s.user = :user AND s.scheduledAt BETWEEN :start AND :end ORDER BY s.scheduledAt ASC")
    List<Schedule> findByUserAndPeriod(@Param("user") User user, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT s FROM Schedule s WHERE s.user = :user AND s.scheduledAt >= :now AND s.completed = false ORDER BY s.scheduledAt ASC")
    List<Schedule> findUpcomingByUser(@Param("user") User user, @Param("now") LocalDateTime now);
}
