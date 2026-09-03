package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.User;
import com.example.jobda.dto.response.DartCompanyResponse;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.util.AuthUtil;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DartService {

    private final RestTemplate restTemplate;
    private final CompanyRepository companyRepository;
    private final ObjectMapper objectMapper;
    private final AuthUtil authUtil;

    @Value("${dart.access-key:}")
    private String accessKey;

    private static final String LIST_URL = "https://opendart.fss.or.kr/api/list.json";
    private static final String COMPANY_URL = "https://opendart.fss.or.kr/api/company.json";

    private static final Map<String, String> CORP_CLS = Map.of(
        "Y", "코스피", "K", "코스닥", "N", "코넥스", "E", "비상장"
    );

    public List<DartCompanyResponse> search(String corpName) {
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("DART API 키가 설정되지 않았습니다.");
        }
        User user = authUtil.getCurrentUser();

        String url = UriComponentsBuilder.fromUriString(LIST_URL)
            .queryParam("crtfc_key", accessKey)
            .queryParam("corp_name", corpName)
            .queryParam("page_count", 20)
            .build().toUriString();

        try {
            String json = restTemplate.getForObject(url, String.class);
            ListResponse listResp = objectMapper.readValue(json, ListResponse.class);

            if (!"000".equals(listResp.status) || listResp.list == null) return List.of();

            return listResp.list.stream()
                .filter(item -> item.corpCode != null)
                .collect(java.util.stream.Collectors.toMap(
                    item -> item.corpCode,
                    item -> item,
                    (a, b) -> a
                ))
                .values().stream()
                .map(item -> toResponse(item, companyRepository.existsByUserAndName(user, item.corpName)))
                .toList();
        } catch (Exception e) {
            log.error("DART 검색 실패: {}", e.getMessage());
            throw new RuntimeException("DART API 호출 실패: " + e.getMessage(), e);
        }
    }

    public DartCompanyResponse getDetail(String corpCode) {
        if (accessKey == null || accessKey.isBlank()) {
            throw new IllegalStateException("DART API 키가 설정되지 않았습니다.");
        }
        User user = authUtil.getCurrentUser();

        String url = UriComponentsBuilder.fromUriString(COMPANY_URL)
            .queryParam("crtfc_key", accessKey)
            .queryParam("corp_code", corpCode)
            .build().toUriString();

        try {
            String json = restTemplate.getForObject(url, String.class);
            CompanyDetail detail = objectMapper.readValue(json, CompanyDetail.class);

            if (!"000".equals(detail.status)) {
                throw new RuntimeException("DART API 오류: " + detail.message);
            }

            return new DartCompanyResponse(
                detail.corpCode, detail.corpName, detail.corpNameEng,
                detail.stockCode, CORP_CLS.getOrDefault(detail.corpCls, detail.corpCls),
                detail.ceoNm, detail.adres, detail.hmUrl, detail.phnNo,
                detail.bizrNo, formatEstDt(detail.estDt), detail.indutyCode,
                companyRepository.existsByUserAndName(user, detail.corpName)
            );
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            log.error("DART 상세 조회 실패: {}", e.getMessage());
            throw new RuntimeException("DART API 호출 실패: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Optional<Company> saveCompany(String corpName, String induty, String address,
                                          String website, String corpCls, String memo) {
        User user = authUtil.getCurrentUser();
        if (companyRepository.existsByUserAndName(user, corpName)) return Optional.empty();

        Company company = Company.builder()
            .name(corpName)
            .industry(induty)
            .location(address)
            .website(website)
            .memo(memo)
            .user(user)
            .build();

        return Optional.of(companyRepository.save(company));
    }

    private DartCompanyResponse toResponse(ListItem item, boolean alreadySaved) {
        return new DartCompanyResponse(
            item.corpCode, item.corpName, null, item.stockCode,
            CORP_CLS.getOrDefault(item.corpCls, item.corpCls),
            null, null, null, null, null, null, null, alreadySaved
        );
    }

    private String formatEstDt(String raw) {
        if (raw == null || raw.length() < 8) return raw;
        return raw.substring(0, 4) + "-" + raw.substring(4, 6) + "-" + raw.substring(6, 8);
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ListResponse {
        String status;
        String message;
        List<ListItem> list;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class ListItem {
        @JsonProperty("corp_code") String corpCode;
        @JsonProperty("corp_name") String corpName;
        @JsonProperty("stock_code") String stockCode;
        @JsonProperty("corp_cls") String corpCls;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class CompanyDetail {
        String status;
        String message;
        @JsonProperty("corp_code") String corpCode;
        @JsonProperty("corp_name") String corpName;
        @JsonProperty("corp_name_eng") String corpNameEng;
        @JsonProperty("stock_code") String stockCode;
        @JsonProperty("ceo_nm") String ceoNm;
        @JsonProperty("corp_cls") String corpCls;
        @JsonProperty("bizr_no") String bizrNo;
        @JsonProperty("adres") String adres;
        @JsonProperty("hm_url") String hmUrl;
        @JsonProperty("phn_no") String phnNo;
        @JsonProperty("induty_code") String indutyCode;
        @JsonProperty("est_dt") String estDt;
    }
}
