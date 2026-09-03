package com.example.jobda.dto.worknet;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlElementWrapper;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlProperty;
import com.fasterxml.jackson.dataformat.xml.annotation.JacksonXmlRootElement;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

public class GangsoDto {

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JacksonXmlRootElement(localName = "smallGiantsList")
    public static class Root {
        private int total;

        @JacksonXmlElementWrapper(useWrapping = false)
        @JacksonXmlProperty(localName = "smallGiant")
        private List<SmallGiant> smallGiant;
    }

    @Getter @Setter @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SmallGiant {
        private String selYear;
        private String sgBrandNm;
        private String coNm;
        private String busiNo;
        private String reperNm;
        private String superIndTpNm;
        private String indTpNm;
        private String regionNm;
        private String coAddr;
        private String coMainProd;
        private String coHomePage;
        private String alwaysWorkerCnt;
    }
}
