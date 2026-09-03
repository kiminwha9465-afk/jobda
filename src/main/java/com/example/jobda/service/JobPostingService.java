package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.JobPosting;
import com.example.jobda.domain.entity.Tag;
import com.example.jobda.domain.entity.User;
import com.example.jobda.domain.enums.ApplicationStatus;
import com.example.jobda.dto.request.JobPostingRequest;
import com.example.jobda.dto.response.JobPostingResponse;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.util.AuthUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final CompanyRepository companyRepository;
    private final TagService tagService;
    private final AuthUtil authUtil;

    public List<JobPostingResponse> findAll() {
        User user = authUtil.getCurrentUser();
        return jobPostingRepository.findByUser(user).stream().map(JobPostingResponse::from).toList();
    }

    public JobPostingResponse findById(Long id) {
        return JobPostingResponse.from(getJobPosting(id));
    }

    public List<JobPostingResponse> findByStatus(ApplicationStatus status) {
        User user = authUtil.getCurrentUser();
        return jobPostingRepository.findByUserAndStatus(user, status).stream().map(JobPostingResponse::from).toList();
    }

    public List<JobPostingResponse> findByCompany(Long companyId) {
        User user = authUtil.getCurrentUser();
        return jobPostingRepository.findByUserAndCompanyId(user, companyId).stream().map(JobPostingResponse::from).toList();
    }

    public List<JobPostingResponse> search(String keyword) {
        User user = authUtil.getCurrentUser();
        return jobPostingRepository.findByUserAndKeyword(user, keyword).stream().map(JobPostingResponse::from).toList();
    }

    public List<JobPostingResponse> findUpcomingDeadlines() {
        User user = authUtil.getCurrentUser();
        return jobPostingRepository.findUpcomingDeadlinesByUser(user, LocalDate.now()).stream()
                .map(JobPostingResponse::from).toList();
    }

    @Transactional
    public JobPostingResponse create(JobPostingRequest request) {
        User user = authUtil.getCurrentUser();
        Company company = resolveCompany(request.companyId());
        JobPosting jobPosting = JobPosting.builder()
                .title(request.title())
                .company(company)
                .url(request.url())
                .deadline(request.deadline())
                .status(request.status() != null ? request.status() : ApplicationStatus.INTERESTED)
                .jobType(request.jobType())
                .department(request.department())
                .memo(request.memo())
                .user(user)
                .build();
        return JobPostingResponse.from(jobPostingRepository.save(jobPosting));
    }

    @Transactional
    public JobPostingResponse update(Long id, JobPostingRequest request) {
        JobPosting jobPosting = getJobPosting(id);
        jobPosting.setTitle(request.title());
        jobPosting.setCompany(resolveCompany(request.companyId()));
        jobPosting.setUrl(request.url());
        jobPosting.setDeadline(request.deadline());
        jobPosting.setJobType(request.jobType());
        jobPosting.setDepartment(request.department());
        jobPosting.setMemo(request.memo());
        if (request.status() != null) jobPosting.setStatus(request.status());
        return JobPostingResponse.from(jobPosting);
    }

    @Transactional
    public JobPostingResponse updateStatus(Long id, ApplicationStatus status) {
        JobPosting jobPosting = getJobPosting(id);
        jobPosting.setStatus(status);
        return JobPostingResponse.from(jobPosting);
    }

    @Transactional
    public JobPostingResponse addTag(Long id, Long tagId) {
        JobPosting jobPosting = getJobPosting(id);
        Tag tag = tagService.getTag(tagId);
        jobPosting.getTags().add(tag);
        return JobPostingResponse.from(jobPosting);
    }

    @Transactional
    public JobPostingResponse removeTag(Long id, Long tagId) {
        JobPosting jobPosting = getJobPosting(id);
        jobPosting.getTags().removeIf(t -> t.getId().equals(tagId));
        return JobPostingResponse.from(jobPosting);
    }

    @Transactional
    public void delete(Long id) {
        jobPostingRepository.deleteById(id);
    }

    private Company resolveCompany(Long companyId) {
        if (companyId == null) return null;
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("기업을 찾을 수 없습니다"));
    }

    private JobPosting getJobPosting(Long id) {
        return jobPostingRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("공고를 찾을 수 없습니다. id=" + id));
    }
}
