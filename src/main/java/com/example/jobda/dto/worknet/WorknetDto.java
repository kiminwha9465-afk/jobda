package com.example.jobda.dto.worknet;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

public class WorknetDto {

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JacksonXmlRootElement(localName = "wantedRoot")
    public static class WantedRoot {
        private int total;

        @JacksonXmlElementWrapper(useWrapping = false)
        @JacksonXmlProperty(localName = "wanted")
        private List<Wanted> wanted;
    }

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Wanted {
        private String wantedAuthNo;
        private String company;
        private String title;
        private String sal;
        private String region;
        private String regDt;
        private String wantedInfoUrl;
    }
}
