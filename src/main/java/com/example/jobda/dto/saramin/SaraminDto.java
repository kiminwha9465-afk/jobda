package com.example.jobda.dto.saramin;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class SaraminDto {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Response(Jobs jobs) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Jobs(
        @JsonProperty("@total") String total,
        List<Job> job
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Job(
        String id,
        String url,
        Company company,
        Position position,
        @JsonProperty("expiration-date") String expirationDate
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Company(Detail detail) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Detail(String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Position(
        String title,
        Code industry,
        Code location,
        @JsonProperty("job-type") Code jobType,
        @JsonProperty("experience-level") ExperienceLevel experienceLevel
    ) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Code(String code, String name) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ExperienceLevel(Integer code, Integer min, Integer max, String name) {}
}
