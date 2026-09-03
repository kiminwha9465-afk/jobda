package com.example.jobda.dto.response;

public record GangsoResponse(
    String coNm,
    String reperNm,
    String indTpNm,
    String superIndTpNm,
    String regionNm,
    String coAddr,
    String coMainProd,
    String coHomePage,
    String alwaysWorkerCnt,
    String sgBrandNm,
    String selYear,
    boolean alreadySaved
) {}
