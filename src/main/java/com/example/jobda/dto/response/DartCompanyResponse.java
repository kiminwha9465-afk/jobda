package com.example.jobda.dto.response;

public record DartCompanyResponse(
    String corpCode,
    String corpName,
    String corpNameEng,
    String stockCode,
    String corpCls,
    String ceoNm,
    String address,
    String website,
    String phone,
    String bizrNo,
    String estDt,
    String indutyCode,
    boolean alreadySaved
) {}
