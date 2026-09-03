package com.example.jobda.repository;

import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {

    List<JobPosting> findByUser(User user);
    List<JobPosting> findByUserAndStatus(User user, ApplicationStatus status);
    List<JobPosting> findByUserAndCompanyId(User user, Long companyId);

    @Query("SELECT jp FROM JobPosting jp WHERE jp.user = :user AND jp.deadline >= :today ORDER BY jp.deadline ASC")
    List<JobPosting> findUpcomingDeadlinesByUser(@Param("user") User user, @Param("today") LocalDate today);

    long countByUserAndStatus(User user, ApplicationStatus status);
    long countByUser(User user);

    @Query("SELECT DISTINCT jp FROM JobPosting jp LEFT JOIN jp.tags t WHERE jp.user = :user AND (" +
           "LOWER(jp.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(jp.memo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(jp.department) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(jp.jobType) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<JobPosting> findByUserAndKeyword(@Param("user") User user, @Param("keyword") String keyword);

    boolean existsByUserAndUrl(User user, String url);
}
