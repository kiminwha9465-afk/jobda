package com.example.jobda.service;

import com.example.jobda.domain.entity.Tag;
import com.example.jobda.dto.request.TagRequest;
import com.example.jobda.dto.response.TagResponse;
import com.example.jobda.repository.TagRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;

    public List<TagResponse> findAll() {
        return tagRepository.findAll().stream().map(TagResponse::from).toList();
    }

    public List<TagResponse> search(String keyword) {
        return tagRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(TagResponse::from).toList();
    }

    @Transactional
    public TagResponse create(TagRequest request) {
        if (tagRepository.existsByName(request.name())) {
            throw new IllegalArgumentException("이미 존재하는 태그명입니다: " + request.name());
        }
        Tag tag = Tag.builder()
                .name(request.name())
                .color(request.color())
                .build();
        return TagResponse.from(tagRepository.save(tag));
    }

    @Transactional
    public TagResponse update(Long id, TagRequest request) {
        Tag tag = getTag(id);
        tag.setName(request.name());
        tag.setColor(request.color());
        return TagResponse.from(tag);
    }

    @Transactional
    public void delete(Long id) {
        tagRepository.deleteById(id);
    }

    public Tag getTag(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("태그를 찾을 수 없습니다. id=" + id));
    }
}
