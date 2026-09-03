package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.entity.WorknetKeyword;
import com.example.jobda.domain.enums.ApplicationStatus;
import com.example.jobda.dto.request.WorknetImportRequest;
import com.example.jobda.dto.response.WorknetJobResponse;
import com.example.jobda.dto.worknet.WorknetDto;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.WorknetKeywordRepository;
import com.example.jobda.util.AuthUtil;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class WorknetService {

    private final RestTemplate restTemplate;
    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobPostingRepository;
    private final WorknetKeywordRepository keywordRepository;
    private final AuthUtil authUtil;

    private final XmlMapper xmlMapper = new XmlMapper();

    @Value("${worknet.access-key:}")
    private String accessKey;

    @Value("${worknet.schedule.count:50}")
    private int scheduleCount;

    private static final String LIST_URL = "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo210L01.do";

    public List<WorknetJobResponse> search(String keyword, int count) {
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("워크넷 API 키가 설정되지 않았습니다. application.properties의 worknet.access-key를 설정해주세요.");
        }
        User user = authUtil.getCurrentUser();
        return searchRaw(keyword, count, user);
    }

    @Transactional
    public Optional<JobPosting> importJob(WorknetImportRequest req) {
        User user = authUtil.getCurrentUser();
        return importJobForUser(req, user);
    }

    @Transactional
    public Optional<JobPosting> importJobForUser(WorknetImportRequest req, User user) {
        if (req.url() != null && jobPostingRepository.existsByUserAndUrl(user, req.url())) {
            return Optional.empty();
        }

        Company company = companyRepository.findByUserAndName(user, req.companyName())
            .orElseGet(() -> companyRepository.save(
                Company.builder()
                    .name(req.companyName())
                    .location(req.location())
                    .user(user)
                    .build()
            ));

        JobPosting posting = JobPosting.builder()
            .title(req.title())
            .company(company)
            .url(req.url())
            .status(ApplicationStatus.INTERESTED)
            .user(user)
            .build();

        return Optional.of(jobPostingRepository.save(posting));
    }

    public int importAll(List<WorknetImportRequest> reqs) {
        int count = 0;
        for (WorknetImportRequest req : reqs) {
            if (importJob(req).isPresent()) count++;
        }
        return count;
    }

    public List<WorknetKeyword> getKeywords() {
        User user = authUtil.getCurrentUser();
        return keywordRepository.findByUserAndActiveTrue(user);
    }

    @Transactional
    public WorknetKeyword addKeyword(String keyword) {
        User user = authUtil.getCurrentUser();
        if (keywordRepository.existsByUserAndKeyword(user, keyword)) {
            throw new IllegalArgumentException("이미 등록된 키워드입니다: " + keyword);
        }
        return keywordRepository.save(WorknetKeyword.builder().keyword(keyword).user(user).build());
    }

    @Transactional
    public void deleteKeyword(Long id) {
        keywordRepository.deleteById(id);
    }

    @Scheduled(cron = "${worknet.schedule.cron:0 30 9 * * *}")
    public void autoCollect() {
        log.info("워크넷 자동 수집 시작");
        int total = collectAllUsers();
        log.info("워크넷 자동 수집 완료: 총 {}개 저장", total);
    }

    public int manualCollect() {
        User user = authUtil.getCurrentUser();
        return collectForUser(user);
    }

    private int collectAllUsers() {
        if (accessKey == null || accessKey.isBlank()) return 0;
        List<WorknetKeyword> keywords = keywordRepository.findByActiveTrue();
        if (keywords.isEmpty()) return 0;

        int total = 0;
        for (WorknetKeyword kw : keywords) {
            if (kw.getUser() == null) continue;
            try {
                List<WorknetJobResponse> jobs = searchRaw(kw.getKeyword(), scheduleCount, kw.getUser());
                for (WorknetJobResponse job : jobs) {
                    if (!job.alreadySaved()) {
                        WorknetImportRequest req = new WorknetImportRequest(
                            job.wantedAuthNo(), job.title(), job.companyName(),
                            job.url(), job.location(), null, null
                        );
                        if (importJobForUser(req, kw.getUser()).isPresent()) total++;
                    }
                }
                kw.setLastCollectedAt(LocalDateTime.now());
                keywordRepository.save(kw);
            } catch (Exception e) {
                log.error("키워드 '{}' 수집 실패: {}", kw.getKeyword(), e.getMessage());
            }
        }
        return total;
    }

    private int collectForUser(User user) {
        if (accessKey == null || accessKey.isBlank()) return 0;
        List<WorknetKeyword> keywords = keywordRepository.findByUserAndActiveTrue(user);
        if (keywords.isEmpty()) return 0;

        int total = 0;
        for (WorknetKeyword kw : keywords) {
            try {
                List<WorknetJobResponse> jobs = searchRaw(kw.getKeyword(), scheduleCount, user);
                for (WorknetJobResponse job : jobs) {
                    if (!job.alreadySaved()) {
                        WorknetImportRequest req = new WorknetImportRequest(
                            job.wantedAuthNo(), job.title(), job.companyName(),
                            job.url(), job.location(), null, null
                        );
                        if (importJobForUser(req, user).isPresent()) total++;
                    }
                }
                kw.setLastCollectedAt(LocalDateTime.now());
                keywordRepository.save(kw);
            } catch (Exception e) {
                log.error("키워드 '{}' 수집 실패: {}", kw.getKeyword(), e.getMessage());
            }
        }
        return total;
    }

    private List<WorknetJobResponse> searchRaw(String keyword, int count, User user) {
        String url = UriComponentsBuilder.fromUriString(LIST_URL)
            .queryParam("authKey", accessKey)
            .queryParam("callTp", "L")
            .queryParam("returnType", "xml")
            .queryParam("startPage", 1)
            .queryParam("display", Math.min(count, 100))
            .queryParam("keyword", keyword)
            .build().toUriString();

        try {
            String xml = restTemplate.getForObject(url, String.class);
            if (xml == null || xml.isBlank()) return List.of();
            WorknetDto.WantedRoot root = xmlMapper.readValue(xml, WorknetDto.WantedRoot.class);
            if (root.getWanted() == null) return List.of();
            return root.getWanted().stream()
                .map(w -> toResponse(w, jobPostingRepository.existsByUserAndUrl(user, w.getWantedInfoUrl())))
                .toList();
        } catch (Exception e) {
            log.error("워크넷 검색 실패: {}", e.getMessage());
            throw new RuntimeException("워크넷 API 호출 실패: " + e.getMessage(), e);
        }
    }

    private WorknetJobResponse toResponse(WorknetDto.Wanted w, boolean alreadySaved) {
        return new WorknetJobResponse(
            w.getWantedAuthNo(),
            w.getTitle(),
            w.getCompany(),
            w.getRegion(),
            w.getSal(),
            formatRegDt(w.getRegDt()),
            w.getWantedInfoUrl(),
            alreadySaved
        );
    }

    private String formatRegDt(String regDt) {
        if (regDt == null || regDt.length() < 8) return null;
        try {
            return regDt.substring(0, 4) + "-" + regDt.substring(4, 6) + "-" + regDt.substring(6, 8);
        } catch (Exception e) {
            return null;
        }
    }
}
