package com.example.jobda.controller;

import com.example.jobda.dto.response.GangsoResponse;
import com.example.jobda.service.GangsoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gangso")
@RequiredArgsConstructor
public class GangsoController {

    private final GangsoService gangsoService;

    @GetMapping("/search")
    public ResponseEntity<List<GangsoResponse>> search(
        @RequestParam(required = false) String region,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int display
    ) {
        return ResponseEntity.ok(gangsoService.search(region, page, display));
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, Object>> save(@RequestBody Map<String, String> body) {
        boolean saved = gangsoService.saveCompany(
            body.get("coNm"), body.get("indTpNm"), body.get("coAddr"),
            body.get("coHomePage"), body.get("alwaysWorkerCnt")
        ).isPresent();
        return ResponseEntity.ok(Map.of("saved", saved));
    }
}
