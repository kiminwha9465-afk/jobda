package com.example.jobda.controller;

import com.example.jobda.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<Map<String, String>> register(@RequestBody Map<String, String> body) {
        AuthService.AuthResult result = authService.register(body.get("email"), body.get("password"), body.get("name"));
        return ResponseEntity.ok(Map.of("token", result.token(), "email", result.email(), "name", result.name()));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> body) {
        AuthService.AuthResult result = authService.login(body.get("email"), body.get("password"));
        return ResponseEntity.ok(Map.of("token", result.token(), "email", result.email(), "name", result.name()));
    }
}
