package com.example.jobda.repository;

import com.example.jobda.domain.entity.Resume;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ResumeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {

    List<Resume> findByUser(User user);
    List<Resume> findByUserAndType(User user, ResumeType type);
    List<Resume> findByUserAndIsTemplate(User user, boolean isTemplate);

    @Query("SELECT DISTINCT r FROM Resume r LEFT JOIN r.tags t WHERE r.user = :user AND (" +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.targetCompany) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.targetPosition) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Resume> findByUserAndKeyword(@Param("user") User user, @Param("keyword") String keyword);
}
