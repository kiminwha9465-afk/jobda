package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.User;
import com.example.jobda.dto.response.GangsoResponse;
import com.example.jobda.dto.worknet.GangsoDto;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.util.AuthUtil;
import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GangsoService {

    private final RestTemplate restTemplate;
    private final CompanyRepository companyRepository;
    private final AuthUtil authUtil;
    private final XmlMapper xmlMapper = new XmlMapper();

    @Value("${worknet.access-key:}")
    private String accessKey;

    private static final String API_URL = "https://www.work24.go.kr/cm/openApi/call/wk/callOpenApiSvcInfo216L01.do";

    public List<GangsoResponse> search(String region, int page, int display) {
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("워크넷 API 키가 설정되지 않았습니다.");
        }
        User user = authUtil.getCurrentUser();

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString(API_URL)
            .queryParam("authKey", accessKey)
            .queryParam("returnType", "XML")
            .queryParam("startPage", page)
            .queryParam("display", Math.min(display, 100));

        if (region != null && !region.isBlank()) {
            builder.queryParam("region", region);
        }

        try {
            String xml = restTemplate.getForObject(builder.build().toUriString(), String.class);
            if (xml == null || xml.isBlank()) return List.of();

            GangsoDto.Root root = xmlMapper.readValue(xml, GangsoDto.Root.class);
            if (root.getSmallGiant() == null) return List.of();

            return root.getSmallGiant().stream()
                .map(g -> toResponse(g, companyRepository.existsByUserAndName(user, g.getCoNm())))
                .toList();
        } catch (Exception e) {
            log.error("강소기업 조회 실패: {}", e.getMessage());
            throw new RuntimeException("강소기업 API 호출 실패: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Optional<Company> saveCompany(String coNm, String indTpNm, String coAddr,
                                         String coHomePage, String alwaysWorkerCnt) {
        User user = authUtil.getCurrentUser();
        if (companyRepository.existsByUserAndName(user, coNm)) return Optional.empty();

        String size = alwaysWorkerCnt != null && !alwaysWorkerCnt.isBlank()
            ? alwaysWorkerCnt + "명" : null;

        Company company = Company.builder()
            .name(coNm)
            .industry(indTpNm)
            .location(coAddr)
            .website(coHomePage)
            .size(size)
            .user(user)
            .build();

        return Optional.of(companyRepository.save(company));
    }

    private GangsoResponse toResponse(GangsoDto.SmallGiant g, boolean alreadySaved) {
        return new GangsoResponse(
            g.getCoNm(), g.getReperNm(), g.getIndTpNm(), g.getSuperIndTpNm(),
            g.getRegionNm(), g.getCoAddr(), g.getCoMainProd(),
            g.getCoHomePage(), g.getAlwaysWorkerCnt(),
            g.getSgBrandNm(), g.getSelYear(), alreadySaved
        );
    }
}
