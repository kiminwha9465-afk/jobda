package com.example.jobda.dto.request;

public record WorknetImportRequest(
    String wantedAuthNo,
    String title,
    String companyName,
    String url,
    String location,
    String jobType,
    String expirationDate
) {}
