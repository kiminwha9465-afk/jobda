package com.example.jobda;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JobdaApplication {

    public static void main(String[] args) {
        SpringApplication.run(JobdaApplication.class, args);
    }

}
