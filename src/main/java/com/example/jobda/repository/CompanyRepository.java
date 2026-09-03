package com.example.jobda.repository;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findByUser(User user);

    @Query("SELECT DISTINCT c FROM Company c LEFT JOIN c.tags t WHERE c.user = :user AND (" +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.industry) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.welfare) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(c.memo) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(t.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<Company> findByUserAndKeyword(@Param("user") User user, @Param("keyword") String keyword);

    Optional<Company> findByUserAndName(User user, String name);
    boolean existsByUserAndName(User user, String name);
}
