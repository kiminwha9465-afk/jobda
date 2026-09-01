package com.example.jobda.repository;

import com.example.jobda.domain.entity.CoverLetterItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoverLetterItemRepository extends JpaRepository<CoverLetterItem, Long> {
    List<CoverLetterItem> findByCoverLetterIdOrderByOrderIndex(Long coverLetterId);
}
