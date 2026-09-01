package com.example.jobda.repository;

import com.example.jobda.domain.entity.CoverLetter;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CoverLetterRepository extends JpaRepository<CoverLetter, Long> {
    List<CoverLetter> findByCompanyId(Long companyId);

    @Query("SELECT DISTINCT cl FROM CoverLetter cl LEFT JOIN cl.items i WHERE " +
           "LOWER(cl.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(cl.targetPosition) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.question) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(i.answer) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<CoverLetter> findByKeyword(@Param("keyword") String keyword);
}
