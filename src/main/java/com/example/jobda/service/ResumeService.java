package com.example.jobda.service;

import com.example.jobda.domain.entity.Resume;
import com.example.jobda.domain.entity.Tag;
import com.example.jobda.domain.enums.ResumeType;
import com.example.jobda.dto.request.ResumeRequest;
import com.example.jobda.dto.response.ResumeResponse;
import com.example.jobda.repository.ResumeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final TagService tagService;
    private final FileStorageService fileStorageService;

    public List<ResumeResponse> findAll() {
        return resumeRepository.findAll().stream().map(ResumeResponse::from).toList();
    }

    public ResumeResponse findById(Long id) {
        return ResumeResponse.from(getResume(id));
    }

    public List<ResumeResponse> findByType(ResumeType type) {
        return resumeRepository.findByType(type).stream().map(ResumeResponse::from).toList();
    }

    public List<ResumeResponse> findTemplates() {
        return resumeRepository.findByIsTemplate(true).stream().map(ResumeResponse::from).toList();
    }

    @Transactional
    public ResumeResponse create(ResumeRequest request) {
        Resume resume = Resume.builder()
                .title(request.title())
                .type(request.type())
                .content(request.content())
                .targetCompany(request.targetCompany())
                .targetPosition(request.targetPosition())
                .version(request.version() != null ? request.version() : 1)
                .isTemplate(request.isTemplate())
                .build();
        return ResumeResponse.from(resumeRepository.save(resume));
    }

    @Transactional
    public ResumeResponse update(Long id, ResumeRequest request) {
        Resume resume = getResume(id);
        resume.setTitle(request.title());
        resume.setType(request.type());
        resume.setContent(request.content());
        resume.setTargetCompany(request.targetCompany());
        resume.setTargetPosition(request.targetPosition());
        if (request.version() != null) resume.setVersion(request.version());
        resume.setTemplate(request.isTemplate());
        return ResumeResponse.from(resume);
    }

    @Transactional
    public ResumeResponse uploadFile(Long id, MultipartFile file) {
        Resume resume = getResume(id);
        if (resume.getFileUrl() != null) {
            fileStorageService.delete(resume.getOriginalFileName());
        }
        String storedName = fileStorageService.store(file);
        resume.setFileUrl("/api/files/" + storedName);
        resume.setOriginalFileName(file.getOriginalFilename());
        return ResumeResponse.from(resume);
    }

    @Transactional
    public ResumeResponse deleteFile(Long id) {
        Resume resume = getResume(id);
        if (resume.getFileUrl() != null) {
            fileStorageService.delete(resume.getOriginalFileName());
            resume.setFileUrl(null);
            resume.setOriginalFileName(null);
        }
        return ResumeResponse.from(resume);
    }

    @Transactional
    public ResumeResponse copyAsNewVersion(Long id) {
        Resume original = getResume(id);
        Resume copy = Resume.builder()
                .title(original.getTitle() + " (v" + (original.getVersion() + 1) + ")")
                .type(original.getType())
                .content(original.getContent())
                .targetCompany(original.getTargetCompany())
                .targetPosition(original.getTargetPosition())
                .version(original.getVersion() + 1)
                .isTemplate(false)
                .build();
        return ResumeResponse.from(resumeRepository.save(copy));
    }

    @Transactional
    public ResumeResponse addTag(Long id, Long tagId) {
        Resume resume = getResume(id);
        Tag tag = tagService.getTag(tagId);
        resume.getTags().add(tag);
        return ResumeResponse.from(resume);
    }

    @Transactional
    public ResumeResponse removeTag(Long id, Long tagId) {
        Resume resume = getResume(id);
        resume.getTags().removeIf(t -> t.getId().equals(tagId));
        return ResumeResponse.from(resume);
    }

    @Transactional
    public void delete(Long id) {
        Resume resume = getResume(id);
        if (resume.getFileUrl() != null) {
            fileStorageService.delete(resume.getOriginalFileName());
        }
        resumeRepository.deleteById(id);
    }

    private Resume getResume(Long id) {
        return resumeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("문서를 찾을 수 없습니다. id=" + id));
    }
}
