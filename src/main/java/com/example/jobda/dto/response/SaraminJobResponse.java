package com.example.jobda.dto.response;

public record SaraminJobResponse(
    String saraminId,
    String title,
    String companyName,
    String location,
    String jobType,
    String industry,
    String experienceLevel,
    String url,
    String expirationDate,
    boolean alreadySaved
) {}
