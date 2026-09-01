package com.example.jobda.controller;

import com.example.jobda.dto.request.CoverLetterItemRequest;
import com.example.jobda.dto.request.CoverLetterRequest;
import com.example.jobda.dto.response.CoverLetterResponse;
import com.example.jobda.service.CoverLetterService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cover-letters")
@RequiredArgsConstructor
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    @GetMapping
    public ResponseEntity<List<CoverLetterResponse>> getAll(
            @RequestParam(required = false) Long companyId) {
        if (companyId != null) return ResponseEntity.ok(coverLetterService.findByCompany(companyId));
        return ResponseEntity.ok(coverLetterService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoverLetterResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(coverLetterService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CoverLetterResponse> create(@Valid @RequestBody CoverLetterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coverLetterService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CoverLetterResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody CoverLetterRequest request) {
        return ResponseEntity.ok(coverLetterService.update(id, request));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<CoverLetterResponse> addItem(
            @PathVariable Long id,
            @Valid @RequestBody CoverLetterItemRequest request) {
        return ResponseEntity.ok(coverLetterService.addItem(id, request));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<CoverLetterResponse> removeItem(
            @PathVariable Long id,
            @PathVariable Long itemId) {
        return ResponseEntity.ok(coverLetterService.removeItem(id, itemId));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<CoverLetterResponse> copyAsNewVersion(@PathVariable Long id) {
        return ResponseEntity.status(HttpStatus.CREATED).body(coverLetterService.copyAsNewVersion(id));
    }

    @PostMapping("/{id}/tags/{tagId}")
    public ResponseEntity<CoverLetterResponse> addTag(
            @PathVariable Long id, @PathVariable Long tagId) {
        return ResponseEntity.ok(coverLetterService.addTag(id, tagId));
    }

    @DeleteMapping("/{id}/tags/{tagId}")
    public ResponseEntity<CoverLetterResponse> removeTag(
            @PathVariable Long id, @PathVariable Long tagId) {
        return ResponseEntity.ok(coverLetterService.removeTag(id, tagId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        coverLetterService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
