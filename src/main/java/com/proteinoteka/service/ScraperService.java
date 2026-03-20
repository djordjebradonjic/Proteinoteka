package com.proteinoteka.service;

import com.proteinoteka.repository.ProductRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.swing.text.Document;
import java.io.IOException;

@Service
@Slf4j
public class ScraperService {

    private final ProductRepository productRepository;


    public ScraperService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public void scrapePansport(){
        String url = "https://www.pansport.rs/proteini/whey-protein-koncentrat";
        try{


        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
