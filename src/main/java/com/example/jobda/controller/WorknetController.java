package com.example.jobda.controller;

import com.example.jobda.domain.entity.WorknetKeyword;
import com.example.jobda.dto.request.WorknetImportRequest;
import com.example.jobda.dto.response.WorknetJobResponse;
import com.example.jobda.service.WorknetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/worknet")
@RequiredArgsConstructor
public class WorknetController {

    private final WorknetService worknetService;

    @GetMapping("/search")
    public ResponseEntity<List<WorknetJobResponse>> search(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "20") int count
    ) {
        return ResponseEntity.ok(worknetService.search(keyword, count));
    }

    @PostMapping("/import")
    public ResponseEntity<Void> importJob(@RequestBody WorknetImportRequest req) {
        worknetService.importJob(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/import-all")
    public ResponseEntity<Integer> importAll(@RequestBody List<WorknetImportRequest> reqs) {
        return ResponseEntity.ok(worknetService.importAll(reqs));
    }

    @PostMapping("/collect")
    public ResponseEntity<Integer> collect() {
        return ResponseEntity.ok(worknetService.manualCollect());
    }

    @GetMapping("/keywords")
    public ResponseEntity<List<WorknetKeyword>> getKeywords() {
        return ResponseEntity.ok(worknetService.getKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<WorknetKeyword> addKeyword(@RequestBody Map<String, String> body) {
        String kw = body.get("keyword");
        if (kw == null || kw.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(worknetService.addKeyword(kw.trim()));
    }

    @DeleteMapping("/keywords/{id}")
    public ResponseEntity<Void> deleteKeyword(@PathVariable Long id) {
        worknetService.deleteKeyword(id);
        return ResponseEntity.noContent().build();
    }
}
