package com.example.jobda.controller;

import com.example.jobda.service.SpellCheckService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/spell-check")
@RequiredArgsConstructor
public class SpellCheckController {

    private final SpellCheckService spellCheckService;

    @PostMapping
    public ResponseEntity<?> check(@RequestBody Map<String, String> body) {
        String text = body.get("text");
        if (text == null || text.isBlank()) return ResponseEntity.badRequest().build();
        return ResponseEntity.ok(spellCheckService.check(text));
    }
}
