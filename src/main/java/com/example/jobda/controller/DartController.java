package com.example.jobda.controller;

import com.example.jobda.dto.response.DartCompanyResponse;
import com.example.jobda.service.DartService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dart")
@RequiredArgsConstructor
public class DartController {

    private final DartService dartService;

    @GetMapping("/search")
    public ResponseEntity<List<DartCompanyResponse>> search(@RequestParam String corpName) {
        return ResponseEntity.ok(dartService.search(corpName));
    }

    @GetMapping("/detail/{corpCode}")
    public ResponseEntity<DartCompanyResponse> detail(@PathVariable String corpCode) {
        return ResponseEntity.ok(dartService.getDetail(corpCode));
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> save(@RequestBody Map<String, String> body) {
        boolean saved = dartService.saveCompany(
            body.get("corpName"), body.get("indutyCode"), body.get("address"),
            body.get("website"), body.get("corpCls"), body.get("memo")
        ).isPresent();
        return ResponseEntity.ok(Map.of("saved", saved));
    }
}
