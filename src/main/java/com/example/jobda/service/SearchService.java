package com.example.jobda.service;

import com.example.jobda.dto.response.*;
import com.example.jobda.repository.CoverLetterRepository;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.repository.JobPostingRepository;
import com.example.jobda.repository.ResumeRepository;
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

    public SearchResponse search(String keyword) {
        List<CompanyResponse> companies = companyRepository.findByKeyword(keyword).stream()
                .map(CompanyResponse::from).toList();
        List<JobPostingResponse> jobPostings = jobPostingRepository.findByKeyword(keyword).stream()
                .map(JobPostingResponse::from).toList();
        List<CoverLetterResponse> coverLetters = coverLetterRepository.findByKeyword(keyword).stream()
                .map(CoverLetterResponse::from).toList();
        List<ResumeResponse> resumes = resumeRepository.findByKeyword(keyword).stream()
                .map(ResumeResponse::from).toList();

        int total = companies.size() + jobPostings.size() + coverLetters.size() + resumes.size();
        return new SearchResponse(keyword, total, companies, jobPostings, coverLetters, resumes);
    }
}
