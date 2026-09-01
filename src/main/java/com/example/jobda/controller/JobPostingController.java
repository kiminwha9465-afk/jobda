package com.example.jobda.controller;

import com.example.jobda.domain.enums.ApplicationStatus;
import com.example.jobda.dto.request.JobPostingRequest;
import com.example.jobda.dto.response.JobPostingResponse;
import com.example.jobda.service.JobPostingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/job-postings")
@RequiredArgsConstructor
public class JobPostingController {

    private final JobPostingService jobPostingService;

    @GetMapping
    public ResponseEntity<List<JobPostingResponse>> getAll(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) Long companyId,
            @RequestParam(required = false) String keyword) {
        if (keyword != null && !keyword.isBlank()) return ResponseEntity.ok(jobPostingService.search(keyword));
        if (status != null) return ResponseEntity.ok(jobPostingService.findByStatus(status));
        if (companyId != null) return ResponseEntity.ok(jobPostingService.findByCompany(companyId));
        return ResponseEntity.ok(jobPostingService.findAll());
    }

    @GetMapping("/upcoming-deadlines")
    public ResponseEntity<List<JobPostingResponse>> getUpcomingDeadlines() {
        return ResponseEntity.ok(jobPostingService.findUpcomingDeadlines());
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobPostingResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(jobPostingService.findById(id));
    }

    @PostMapping
    public ResponseEntity<JobPostingResponse> create(@Valid @RequestBody JobPostingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(jobPostingService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JobPostingResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody JobPostingRequest request) {
        return ResponseEntity.ok(jobPostingService.update(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<JobPostingResponse> updateStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status) {
        return ResponseEntity.ok(jobPostingService.updateStatus(id, status));
    }

    @PostMapping("/{id}/tags/{tagId}")
    public ResponseEntity<JobPostingResponse> addTag(
            @PathVariable Long id, @PathVariable Long tagId) {
        return ResponseEntity.ok(jobPostingService.addTag(id, tagId));
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    public ResponseEntity<JobPostingResponse> removeTag(
            @PathVariable Long id, @PathVariable Long tagId) {
        return ResponseEntity.ok(jobPostingService.removeTag(id, tagId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        jobPostingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
