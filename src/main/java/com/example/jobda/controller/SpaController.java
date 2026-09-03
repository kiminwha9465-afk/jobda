package com.example.jobda.controller;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaController {

    @RequestMapping(value = { "/{path:[^\\.]*}" })
    public String forward(HttpServletRequest request) {
        return "forward:/index.html";
    }
}
