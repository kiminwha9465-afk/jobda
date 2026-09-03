package com.example.jobda.repository;

import com.example.jobda.domain.entity.WorknetKeyword;
import com.example.jobda.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface WorknetKeywordRepository extends JpaRepository<WorknetKeyword, Long> {
    List<WorknetKeyword> findByUserAndActiveTrue(User user);
    boolean existsByUserAndKeyword(User user, String keyword);
    List<WorknetKeyword> findByActiveTrue(); // for scheduled task
}
