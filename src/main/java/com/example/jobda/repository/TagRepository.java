package com.example.jobda.repository;

import com.example.jobda.domain.entity.Tag;
import com.example.jobda.domain.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByUser(User user);
    List<Tag> findByUserAndNameContainingIgnoreCase(User user, String keyword);
    Optional<Tag> findByUserAndName(User user, String name);
    boolean existsByUserAndName(User user, String name);
}
