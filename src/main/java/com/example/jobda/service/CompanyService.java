package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.Tag;
import com.example.jobda.domain.entity.User;
import com.example.jobda.dto.request.CompanyRequest;
import com.example.jobda.dto.response.CompanyResponse;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.util.AuthUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CompanyService {

    private final CompanyRepository companyRepository;
    private final TagService tagService;
    private final AuthUtil authUtil;

    public List<CompanyResponse> findAll() {
        User user = authUtil.getCurrentUser();
        return companyRepository.findByUser(user).stream().map(CompanyResponse::from).toList();
    }

    public CompanyResponse findById(Long id) {
        return CompanyResponse.from(getCompany(id));
    }

    public List<CompanyResponse> search(String keyword) {
        User user = authUtil.getCurrentUser();
        return companyRepository.findByUserAndKeyword(user, keyword).stream().map(CompanyResponse::from).toList();
    }

    @Transactional
    public CompanyResponse create(CompanyRequest request) {
        User user = authUtil.getCurrentUser();
        Company company = Company.builder()
                .name(request.name())
                .industry(request.industry())
                .location(request.location())
                .website(request.website())
                .size(request.size())
                .welfare(request.welfare())
                .memo(request.memo())
                .user(user)
                .build();
        return CompanyResponse.from(companyRepository.save(company));
    }

    @Transactional
    public CompanyResponse update(Long id, CompanyRequest request) {
        Company company = getCompany(id);
        company.setName(request.name());
        company.setIndustry(request.industry());
        company.setLocation(request.location());
        company.setWebsite(request.website());
        company.setSize(request.size());
        company.setWelfare(request.welfare());
        company.setMemo(request.memo());
        return CompanyResponse.from(company);
    }

    @Transactional
    public CompanyResponse addTag(Long id, Long tagId) {
        Company company = getCompany(id);
        Tag tag = tagService.getTag(tagId);
        company.getTags().add(tag);
        return CompanyResponse.from(company);
    }

    @Transactional
    public CompanyResponse removeTag(Long id, Long tagId) {
        Company company = getCompany(id);
        company.getTags().removeIf(t -> t.getId().equals(tagId));
        return CompanyResponse.from(company);
    }

    @Transactional
    public void delete(Long id) {
        companyRepository.deleteById(id);
    }

    private Company getCompany(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("기업을 찾을 수 없습니다. id=" + id));
    }
}
