package com.proteinoteka;

import com.proteinoteka.service.ScraperService;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner run(ScraperService scraperService) {
		return args -> {System.out.println("--- Aplikacija se pokreće, krećem sa skrapovanjem ---");

			// Pozivamo metodu iz tvog servisa
			scraperService.scrapePansport();

			System.out.println("--- Skrapovanje je završeno! Proveri bazu podataka. ---");
		};

	}

}


