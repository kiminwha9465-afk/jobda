package com.example.jobda.repository;

import com.example.jobda.domain.entity.SaraminKeyword;
import com.example.jobda.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SaraminKeywordRepository extends JpaRepository<SaraminKeyword, Long> {
    List<SaraminKeyword> findByUserAndActiveTrue(User user);
    boolean existsByUserAndKeyword(User user, String keyword);
    List<SaraminKeyword> findByActiveTrue(); // for scheduled task
}
