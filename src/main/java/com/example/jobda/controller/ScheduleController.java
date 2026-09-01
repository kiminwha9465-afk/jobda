package com.example.jobda.controller;

import com.example.jobda.domain.enums.ScheduleType;
import com.example.jobda.dto.request.ScheduleRequest;
import com.example.jobda.dto.response.ScheduleResponse;
import com.example.jobda.service.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {

    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> getAll(
            @RequestParam(required = false) ScheduleType type,
            @RequestParam(required = false) Long jobPostingId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        if (type != null) return ResponseEntity.ok(scheduleService.findByType(type));
        if (jobPostingId != null) return ResponseEntity.ok(scheduleService.findByJobPosting(jobPostingId));
        if (start != null && end != null) return ResponseEntity.ok(scheduleService.findByPeriod(start, end));
        return ResponseEntity.ok(scheduleService.findAll());
    }

    @GetMapping("/upcoming")
    public ResponseEntity<List<ScheduleResponse>> getUpcoming() {
        return ResponseEntity.ok(scheduleService.findUpcoming());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScheduleResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.findById(id));
    }

    @PostMapping
    public ResponseEntity<ScheduleResponse> create(@Valid @RequestBody ScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.create(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScheduleResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody ScheduleRequest request) {
        return ResponseEntity.ok(scheduleService.update(id, request));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ScheduleResponse> toggleComplete(@PathVariable Long id) {
        return ResponseEntity.ok(scheduleService.toggleComplete(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
