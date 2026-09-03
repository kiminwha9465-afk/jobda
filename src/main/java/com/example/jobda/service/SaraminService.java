package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.entity.SaraminKeyword;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ApplicationStatus;
import com.example.jobda.dto.request.SaraminImportRequest;
import com.example.jobda.dto.response.SaraminJobResponse;
import com.example.jobda.dto.saramin.SaraminDto;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.SaraminKeywordRepository;
import com.example.jobda.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SaraminService {

    private final RestTemplate restTemplate;
    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobPostingRepository;
    private final SaraminKeywordRepository keywordRepository;
    private final AuthUtil authUtil;

    @Value("${saramin.access-key:}")
    private String accessKey;

    @Value("${saramin.schedule.count:50}")
    private int scheduleCount;

    private static final String API_URL = "https://oapi.saramin.co.kr/job-search";

    public List<SaraminJobResponse> search(String keyword, int count) {
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("사람인 API 키가 설정되지 않았습니다. application.properties의 saramin.access-key를 설정해주세요.");
        }
        User user = authUtil.getCurrentUser();
        String url = UriComponentsBuilder.fromUriString(API_URL)
            .queryParam("access-key", accessKey)
            .queryParam("keywords", keyword)
            .queryParam("count", Math.min(count, 110))
            .build().toUriString();

        SaraminDto.Response response = restTemplate.getForObject(url, SaraminDto.Response.class);

        if (response == null || response.jobs() == null || response.jobs().job() == null) {
            return List.of();
        }

        return response.jobs().job().stream()
            .map(job -> toResponse(job, jobPostingRepository.existsByUserAndUrl(user, job.url())))
            .toList();
    }

    @Transactional
    public Optional<JobPosting> importJob(SaraminImportRequest req) {
        User user = authUtil.getCurrentUser();
        return importJobForUser(req, user);
    }

    @Transactional
    public Optional<JobPosting> importJobForUser(SaraminImportRequest req, User user) {
        if (req.url() != null && jobPostingRepository.existsByUserAndUrl(user, req.url())) {
            return Optional.empty();
        }

        Company company = companyRepository.findByUserAndName(user, req.companyName())
            .orElseGet(() -> companyRepository.save(
                Company.builder()
                    .name(req.companyName())
                    .industry(req.industry())
                    .location(req.location())
                    .user(user)
                    .build()
            ));

        LocalDate deadline = parseDate(req.expirationDate());
        String memo = req.experienceLevel() != null ? "경력: " + req.experienceLevel() : null;

        JobPosting posting = JobPosting.builder()
            .title(req.title())
            .company(company)
            .url(req.url())
            .deadline(deadline)
            .jobType(req.jobType())
            .status(ApplicationStatus.INTERESTED)
            .memo(memo)
            .user(user)
            .build();

        return Optional.of(jobPostingRepository.save(posting));
    }

    public int importAll(List<SaraminImportRequest> reqs) {
        int count = 0;
        for (SaraminImportRequest req : reqs) {
            if (importJob(req).isPresent()) count++;
        }
        return count;
    }

    public List<SaraminKeyword> getKeywords() {
        User user = authUtil.getCurrentUser();
        return keywordRepository.findByUserAndActiveTrue(user);
    }

    @Transactional
    public SaraminKeyword addKeyword(String keyword) {
        User user = authUtil.getCurrentUser();
        if (keywordRepository.existsByUserAndKeyword(user, keyword)) {
            throw new IllegalArgumentException("이미 등록된 키워드입니다: " + keyword);
        }
        return keywordRepository.save(SaraminKeyword.builder().keyword(keyword).user(user).build());
    }

    @Transactional
    public void deleteKeyword(Long id) {
        keywordRepository.deleteById(id);
    }

    @Scheduled(cron = "${saramin.schedule.cron:0 0 9 * * *}")
    public void autoCollect() {
        log.info("사람인 자동 수집 시작");
        int total = collectAllUsers();
        log.info("사람인 자동 수집 완료: 총 {}개 저장", total);
    }

    public int manualCollect() {
        User user = authUtil.getCurrentUser();
        return collectForUser(user);
    }

    private int collectAllUsers() {
        if (accessKey == null || accessKey.isBlank()) return 0;
        List<SaraminKeyword> keywords = keywordRepository.findByActiveTrue();
        if (keywords.isEmpty()) return 0;

        int total = 0;
        for (SaraminKeyword kw : keywords) {
            if (kw.getUser() == null) continue;
            try {
                List<SaraminJobResponse> jobs = searchRaw(kw.getKeyword(), scheduleCount, kw.getUser());
                for (SaraminJobResponse job : jobs) {
                    if (!job.alreadySaved()) {
                        SaraminImportRequest req = new SaraminImportRequest(
                            job.saraminId(), job.title(), job.companyName(),
                            job.url(), job.location(), job.jobType(), job.industry(),
                            job.experienceLevel(), job.expirationDate()
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
        List<SaraminKeyword> keywords = keywordRepository.findByUserAndActiveTrue(user);
        if (keywords.isEmpty()) return 0;

        int total = 0;
        for (SaraminKeyword kw : keywords) {
            try {
                List<SaraminJobResponse> jobs = searchRaw(kw.getKeyword(), scheduleCount, user);
                for (SaraminJobResponse job : jobs) {
                    if (!job.alreadySaved()) {
                        SaraminImportRequest req = new SaraminImportRequest(
                            job.saraminId(), job.title(), job.companyName(),
                            job.url(), job.location(), job.jobType(), job.industry(),
                            job.experienceLevel(), job.expirationDate()
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

    private List<SaraminJobResponse> searchRaw(String keyword, int count, User user) {
        String url = UriComponentsBuilder.fromUriString(API_URL)
            .queryParam("access-key", accessKey)
            .queryParam("keywords", keyword)
            .queryParam("count", Math.min(count, 110))
            .build().toUriString();
        SaraminDto.Response response = restTemplate.getForObject(url, SaraminDto.Response.class);
        if (response == null || response.jobs() == null || response.jobs().job() == null) return List.of();
        return response.jobs().job().stream()
            .map(job -> toResponse(job, jobPostingRepository.existsByUserAndUrl(user, job.url())))
            .toList();
    }

    private SaraminJobResponse toResponse(SaraminDto.Job job, boolean alreadySaved) {
        String title = job.position() != null ? job.position().title() : "제목 없음";
        String companyName = job.company() != null && job.company().detail() != null
            ? job.company().detail().name() : "회사명 없음";
        String location = job.position() != null && job.position().location() != null
            ? job.position().location().name() : null;
        String jobType = job.position() != null && job.position().jobType() != null
            ? job.position().jobType().name() : null;
        String industry = job.position() != null && job.position().industry() != null
            ? job.position().industry().name() : null;
        String expLevel = job.position() != null && job.position().experienceLevel() != null
            ? job.position().experienceLevel().name() : null;

        return new SaraminJobResponse(
            job.id(), title, companyName, location, jobType, industry,
            expLevel, job.url(), job.expirationDate(), alreadySaved
        );
    }

    private LocalDate parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank() || dateStr.length() < 10) return null;
        try {
            return LocalDate.parse(dateStr.substring(0, 10));
        } catch (Exception e) {
            return null;
        }
    }
}
