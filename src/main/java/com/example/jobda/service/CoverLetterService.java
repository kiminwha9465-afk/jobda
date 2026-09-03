package com.example.jobda.service;

import com.example.jobda.domain.entity.Company;
import com.example.jobda.domain.entity.CoverLetter;
import com.example.jobda.domain.entity.CoverLetterItem;
import com.example.jobda.domain.entity.Tag;
import com.example.jobda.domain.entity.User;
import com.example.jobda.dto.request.CoverLetterItemRequest;
import com.example.jobda.dto.request.CoverLetterRequest;
import com.example.jobda.dto.response.CoverLetterResponse;
import com.example.jobda.repository.CompanyRepository;
import com.example.jobda.repository.CoverLetterRepository;
import com.example.jobda.util.AuthUtil;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CoverLetterService {

    private final CoverLetterRepository coverLetterRepository;
    private final CompanyRepository companyRepository;
    private final TagService tagService;
    private final AuthUtil authUtil;

    public List<CoverLetterResponse> findAll() {
        User user = authUtil.getCurrentUser();
        return coverLetterRepository.findByUser(user).stream().map(CoverLetterResponse::from).toList();
    }

    public CoverLetterResponse findById(Long id) {
        return CoverLetterResponse.from(getCoverLetter(id));
    }

    public List<CoverLetterResponse> findByCompany(Long companyId) {
        User user = authUtil.getCurrentUser();
        return coverLetterRepository.findByUserAndCompanyId(user, companyId).stream()
                .map(CoverLetterResponse::from).toList();
    }

    @Transactional
    public CoverLetterResponse create(CoverLetterRequest request) {
        User user = authUtil.getCurrentUser();
        Company company = resolveCompany(request.companyId());

        CoverLetter coverLetter = CoverLetter.builder()
                .title(request.title())
                .company(company)
                .targetPosition(request.targetPosition())
                .version(request.version() != null ? request.version() : 1)
                .user(user)
                .build();

        if (request.items() != null) {
            request.items().forEach(itemReq -> {
                CoverLetterItem item = buildItem(itemReq, coverLetter);
                coverLetter.getItems().add(item);
            });
        }

        return CoverLetterResponse.from(coverLetterRepository.save(coverLetter));
    }

    @Transactional
    public CoverLetterResponse update(Long id, CoverLetterRequest request) {
        CoverLetter coverLetter = getCoverLetter(id);
        Company company = resolveCompany(request.companyId());

        coverLetter.setTitle(request.title());
        coverLetter.setCompany(company);
        coverLetter.setTargetPosition(request.targetPosition());
        if (request.version() != null) coverLetter.setVersion(request.version());

        coverLetter.getItems().clear();
        if (request.items() != null) {
            request.items().forEach(itemReq -> coverLetter.getItems().add(buildItem(itemReq, coverLetter)));
        }

        return CoverLetterResponse.from(coverLetter);
    }

    @Transactional
    public CoverLetterResponse addItem(Long coverLetterId, CoverLetterItemRequest request) {
        CoverLetter coverLetter = getCoverLetter(coverLetterId);
        coverLetter.getItems().add(buildItem(request, coverLetter));
        return CoverLetterResponse.from(coverLetter);
    }

    @Transactional
    public CoverLetterResponse removeItem(Long coverLetterId, Long itemId) {
        CoverLetter coverLetter = getCoverLetter(coverLetterId);
        coverLetter.getItems().removeIf(item -> item.getId().equals(itemId));
        return CoverLetterResponse.from(coverLetter);
    }

    @Transactional
    public CoverLetterResponse copyAsNewVersion(Long id) {
        CoverLetter original = getCoverLetter(id);
        CoverLetter copy = CoverLetter.builder()
                .title(original.getTitle() + " (v" + (original.getVersion() + 1) + ")")
                .company(original.getCompany())
                .targetPosition(original.getTargetPosition())
                .version(original.getVersion() + 1)
                .user(original.getUser())
                .build();

        original.getItems().forEach(item -> copy.getItems().add(
                CoverLetterItem.builder()
                        .coverLetter(copy)
                        .question(item.getQuestion())
                        .answer(item.getAnswer())
                        .charLimit(item.getCharLimit())
                        .orderIndex(item.getOrderIndex())
                        .build()
        ));

        return CoverLetterResponse.from(coverLetterRepository.save(copy));
    }

    @Transactional
    public CoverLetterResponse addTag(Long id, Long tagId) {
        CoverLetter coverLetter = getCoverLetter(id);
        Tag tag = tagService.getTag(tagId);
        coverLetter.getTags().add(tag);
        return CoverLetterResponse.from(coverLetter);
    }

    @Transactional
    public CoverLetterResponse removeTag(Long id, Long tagId) {
        CoverLetter coverLetter = getCoverLetter(id);
        coverLetter.getTags().removeIf(t -> t.getId().equals(tagId));
        return CoverLetterResponse.from(coverLetter);
    }

    @Transactional
    public void delete(Long id) {
        coverLetterRepository.deleteById(id);
    }

    private CoverLetter getCoverLetter(Long id) {
        return coverLetterRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("자소서를 찾을 수 없습니다. id=" + id));
    }

    private Company resolveCompany(Long companyId) {
        if (companyId == null) return null;
        return companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("기업을 찾을 수 없습니다"));
    }

    private CoverLetterItem buildItem(CoverLetterItemRequest req, CoverLetter coverLetter) {
        return CoverLetterItem.builder()
                .coverLetter(coverLetter)
                .question(req.question())
                .answer(req.answer())
                .charLimit(req.charLimit())
                .orderIndex(req.orderIndex() != null ? req.orderIndex() : 0)
                .build();
    }
}
