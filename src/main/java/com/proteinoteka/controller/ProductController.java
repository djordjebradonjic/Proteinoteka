package com.proteinoteka.controller;

import com.proteinoteka.dto.ProductDTO;
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
    public List<ProductDTO> getAllProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @GetMapping
    public List<ProductDTO> getProducts(@RequestParam(required = false) String name) {
        List<Product> products;

        if (name != null && !name.isEmpty()) {
            products = productRepository.findByNameContainingIgnoreCase(name);
        } else {
            products = productRepository.findAll();
        }

        return products.stream()
                .map(this::convertToDTO)
                .toList();
    }


    private ProductDTO convertToDTO(Product product) {
        return new ProductDTO(
                product.getName(),
                product.getBrand(),
                product.getPrice(),
                product.getImageUrl(),
                product.getUrl(),
                product.getStore() != null ? product.getStore().getName() : "Unknown",
                product.getPackage_weight(),
                product.getFlavours()
        );
    }

    @GetMapping("/store/{storeName}")
    public List<Product> getProductsByStore(@PathVariable String storeName) {

        return productRepository.findAll().stream()
                .filter(p -> p.getStore().getName().equalsIgnoreCase(storeName))
                .toList();
    }
}
