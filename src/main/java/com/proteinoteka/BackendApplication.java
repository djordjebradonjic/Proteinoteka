package com.proteinoteka;


import com.proteinoteka.model.Product;
import com.proteinoteka.service.ScraperService;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.List;

@Slf4j
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner run(ScraperService scraperService) {
		return args -> {log.info("--- Application statrs scraping---");

			List<Product> products =  scraperService.scrapePansport();

			log.info("--- Scraping is over. Check database---");
		};

	}

}


