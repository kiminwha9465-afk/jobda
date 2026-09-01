package com.example.jobda.repository;

import com.example.jobda.domain.entity.Resume;
import com.example.jobda.domain.enums.ResumeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ResumeRepository extends JpaRepository<Resume, Long> {
    List<Resume> findByType(ResumeType type);
    List<Resume> findByIsTemplate(boolean isTemplate);
    List<Resume> findByTargetCompanyContainingIgnoreCase(String keyword);

    @Query("SELECT r FROM Resume r WHERE " +
           "LOWER(r.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.content) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.targetCompany) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(r.targetPosition) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Resume> findByKeyword(@Param("keyword") String keyword);
}
