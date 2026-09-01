package com.example.jobda.repository;

import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByStatus(ApplicationStatus status);
    List<JobPosting> findByCompanyId(Long companyId);
    List<JobPosting> findByDeadlineBeforeAndStatusNot(LocalDate date, ApplicationStatus status);

    @Query("SELECT jp FROM JobPosting jp WHERE jp.deadline >= :today ORDER BY jp.deadline ASC")
    List<JobPosting> findUpcomingDeadlines(@Param("today") LocalDate today);

    long countByStatus(ApplicationStatus status);

    @Query("SELECT jp FROM JobPosting jp WHERE " +
           "LOWER(jp.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(jp.memo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(jp.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(jp.jobType) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<JobPosting> findByKeyword(@Param("keyword") String keyword);
}
