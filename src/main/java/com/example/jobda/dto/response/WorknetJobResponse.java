package com.example.jobda.dto.response;

public record WorknetJobResponse(
    String wantedAuthNo,
    String title,
    String companyName,
    String location,
    String salary,
    String registeredDate,
    String url,
    boolean alreadySaved
) {}
