package com.example.jobda.dto.request;

public record SaraminImportRequest(
    String saraminId,
    String title,
    String companyName,
    String url,
    String location,
    String jobType,
    String industry,
    String experienceLevel,
    String expirationDate
) {}
