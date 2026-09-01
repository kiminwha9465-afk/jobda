package com.example.jobda.repository;

import com.example.jobda.domain.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByNameContainingIgnoreCase(String keyword);
    List<Company> findByIndustry(String industry);

    @Query("SELECT c FROM Company c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.industry) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.welfare) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.memo) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Company> findByKeyword(@Param("keyword") String keyword);
}
