package com.proteinoteka.service;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import com.proteinoteka.repository.ProductRepository;
import com.proteinoteka.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;

@Service
@Slf4j
@RequiredArgsConstructor
public class ScraperService {

    private final ProductRepository productRepository;
    private final StoreRepository storeRepository;

    public void scrapePansport() {
        String url = "https://www.pansport.rs/proteini/whey-protein-koncentrat";
        Store pansport = storeRepository.findByName("Pansport").
                orElseThrow(() -> new RuntimeException("Store Pansport not found"));
        try {

            Document doc = Jsoup.connect(url)
                    .userAgent("Mozilla/5.0") // Pretvaramo se da smo običan korisnik
                    .get();


            Elements elements = doc.select(".product-item");

            for (Element el : elements) {
                String name = el.select(".product-name").text();
                String priceText = el.select(".price").text()
                        .replaceAll("[^0-9]", ""); // Uzimamo samo brojeve

                if (!priceText.isEmpty()) {
                    Product product = new Product();
                    product.setName(name);
                    product.setPrice(priceText);
                    product.setStore(pansport);
                    product.setLastUpdated(LocalDateTime.now());

                    productRepository.save(product);
                    log.info("Saved product: {} - {} RSD", name, priceText);
                }
            }
        } catch (IOException e) {
            log.error("Scraping error: {}", e.getMessage());
        }
    }
}