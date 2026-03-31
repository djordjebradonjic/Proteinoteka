package com.proteinoteka.controller;

import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Dozvoljavaš sutra Frontendu da pristupi
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @GetMapping("/store/{storeName}")
    public List<Product> getProductsByStore(@PathVariable String storeName) {

        return productRepository.findAll().stream()
                .filter(p -> p.getStore().getName().equalsIgnoreCase(storeName))
                .toList();
    }
}
