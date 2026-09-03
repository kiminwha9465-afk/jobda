package com.example.jobda.service;

import com.example.jobda.domain.entity.User;
import com.example.jobda.dto.response.*;
import com.example.jobda.repository.CoverLetterRepository;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.ResumeRepository;
import com.example.jobda.util.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchService {

    private final CompanyRepository companyRepository;
    private final JobPostingRepository jobPostingRepository;
    private final CoverLetterRepository coverLetterRepository;
    private final ResumeRepository resumeRepository;
    private final AuthUtil authUtil;

    public SearchResponse search(String keyword) {
        User user = authUtil.getCurrentUser();
        List<CompanyResponse> companies = companyRepository.findByUserAndKeyword(user, keyword).stream()
                .map(CompanyResponse::from).toList();
        List<JobPostingResponse> jobPostings = jobPostingRepository.findByUserAndKeyword(user, keyword).stream()
                .map(JobPostingResponse::from).toList();
        List<CoverLetterResponse> coverLetters = coverLetterRepository.findByUserAndKeyword(user, keyword).stream()
                .map(CoverLetterResponse::from).toList();
        List<ResumeResponse> resumes = resumeRepository.findByUserAndKeyword(user, keyword).stream()
                .map(ResumeResponse::from).toList();

        int total = companies.size() + jobPostings.size() + coverLetters.size() + resumes.size();
        return new SearchResponse(keyword, total, companies, jobPostings, coverLetters, resumes);
    }
}
