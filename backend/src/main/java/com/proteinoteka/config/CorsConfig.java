package com.proteinoteka.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig implements WebMvcConfigurer {


    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:3000",
                        "https://proteinoteka.vercel.app",
                        "https://proteinoteka.rs",
                        "https://www.proteinoteka.rs",
                        "https://proteinoteka.com.hr",
                        "https://www.proteinoteka.com.hr"
                )
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                .allowedHeaders("*");

        // B2B API is accessed by third-party developers — allow all origins
        registry.addMapping("/api/v1/b2b/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET")
                .allowedHeaders("*");
    }
}
