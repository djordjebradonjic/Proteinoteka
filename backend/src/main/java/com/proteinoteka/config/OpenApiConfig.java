package com.proteinoteka.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {
    @Bean
    public OpenAPI proteiontekaOpenApi(){
        return new OpenAPI()
                .info(new Info()
                        .title("Proteinoteka Api")
                        .description("System for scraping and following prices of protein supplements in Serbia")
                        .version("v1.0")
                        .contact(new Contact()
                                .name("Djordje Bradonjic")
                                .email("djordjebradonjic99@gmail.com")
                ));
    }
}
