package com.example.jobda.controller;

import com.example.jobda.domain.enums.ResumeType;
import com.example.jobda.dto.request.ResumeRequest;
import com.example.jobda.dto.response.ResumeResponse;
import com.example.jobda.service.ResumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    @GetMapping
    public ResponseEntity<List<ResumeResponse>> getAll(
            @RequestParam(required = false) ResumeType type,
            @RequestParam(required = false, defaultValue = "false") boolean templateOnly) {
        if (templateOnly) return ResponseEntity.ok(resumeService.findTemplates());
        if (type != null) return ResponseEntity.ok(resumeService.findByType(type));
        return ResponseEntity.ok(resumeService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResumeResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(resumeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ResumeResponse> create(@Valid @RequestBody ResumeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ResumeResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ResumeRequest request) {
        return ResponseEntity.ok(resumeService.update(id, request));
    }

    @PostMapping(value = "/{id}/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> uploadFile(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(resumeService.uploadFile(id, file));
    }

    @DeleteMapping("/{id}/file")
    public ResponseEntity<ResumeResponse> deleteFile(@PathVariable Long id) {
        return ResponseEntity.ok(resumeService.deleteFile(id));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<ResumeResponse> copyAsNewVersion(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.copyAsNewVersion(id));
    }

    @PostMapping("/{id}/tags/{tagId}")
    public ResponseEntity<ResumeResponse> addTag(
            @PathVariable Long id, @PathVariable Long tagId) {
        return ResponseEntity.ok(resumeService.addTag(id, tagId));
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    public ResponseEntity<ResumeResponse> removeTag(
            @PathVariable Long id, @PathVariable Long tagId) {
        return ResponseEntity.ok(resumeService.removeTag(id, tagId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        resumeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
