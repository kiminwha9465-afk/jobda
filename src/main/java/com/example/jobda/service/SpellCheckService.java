package com.example.jobda.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpellCheckService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Map<String, Object> check(String text) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            headers.set("Referer", "https://speller.cs.pusan.ac.kr");
            headers.set("User-Agent", "Mozilla/5.0");

            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("text1", text);
            body.add("where", "0");
            body.add("changed", "1");

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://speller.cs.pusan.ac.kr/results", request, String.class);

            String raw = response.getBody();
            if (raw == null) return Map.of("errors", List.of(), "success", false);

            // 응답에서 JSON 배열 부분 추출
            int start = raw.indexOf('[');
            int end = raw.lastIndexOf(']') + 1;
            if (start < 0 || end <= start) return Map.of("errors", List.of(), "success", true);

            String json = raw.substring(start, end);
            // 외부 배열 안에 errInfo 포함
            JsonNode root = objectMapper.readTree(json);
            List<Map<String, Object>> errors = new ArrayList<>();

            for (JsonNode item : root) {
                JsonNode errInfo = item.get("errInfo");
                if (errInfo == null) continue;
                for (JsonNode err : errInfo) {
                    String orgStr = err.path("orgStr").asText("");
                    String candWord = err.path("candWord").asText("");
                    String help = err.path("help").asText("");
                    int type = err.path("type").asInt(0);

                    List<String> suggestions = new ArrayList<>();
                    for (String s : candWord.split("\\|")) {
                        if (!s.isBlank()) suggestions.add(s.trim());
                    }

                    errors.add(Map.of(
                        "original", orgStr,
                        "suggestions", suggestions,
                        "help", help,
                        "type", type
                    ));
                }
            }

            return Map.of("errors", errors, "success", true);

        } catch (Exception e) {
            log.error("맞춤법 검사 실패: {}", e.getMessage());
            return Map.of("errors", List.of(), "success", false, "message", "맞춤법 검사 서버에 연결할 수 없습니다.");
        }
    }
}
