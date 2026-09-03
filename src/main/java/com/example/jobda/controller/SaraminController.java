package com.example.jobda.controller;

import com.example.jobda.domain.entity.SaraminKeyword;
import com.example.jobda.dto.request.SaraminImportRequest;
import com.example.jobda.dto.response.SaraminJobResponse;
import com.example.jobda.service.SaraminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saramin")
@RequiredArgsConstructor
public class SaraminController {

    private final SaraminService saraminService;

    @GetMapping("/search")
    public ResponseEntity<List<SaraminJobResponse>> search(
        @RequestParam String keyword,
        @RequestParam(defaultValue = "20") int count
    ) {
        return ResponseEntity.ok(saraminService.search(keyword, count));
    }

    @PostMapping("/import")
    public ResponseEntity<Void> importJob(@RequestBody SaraminImportRequest req) {
        saraminService.importJob(req);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/import-all")
    public ResponseEntity<Integer> importAll(@RequestBody List<SaraminImportRequest> reqs) {
        return ResponseEntity.ok(saraminService.importAll(reqs));
    }

    @PostMapping("/collect")
    public ResponseEntity<Integer> collect() {
        return ResponseEntity.ok(saraminService.manualCollect());
    }

    @GetMapping("/keywords")
    public ResponseEntity<List<SaraminKeyword>> getKeywords() {
        return ResponseEntity.ok(saraminService.getKeywords());
    }

    @PostMapping("/keywords")
    public ResponseEntity<SaraminKeyword> addKeyword(@RequestBody Map<String, String> body) {
        String kw = body.get("keyword");
        if (kw == null || kw.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(saraminService.addKeyword(kw.trim()));
    }

    @DeleteMapping("/keywords/{id}")
    public ResponseEntity<Void> deleteKeyword(@PathVariable Long id) {
        saraminService.deleteKeyword(id);
        return ResponseEntity.noContent().build();
    }
}
