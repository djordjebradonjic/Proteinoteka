package com.proteinoteka.controller;

import com.proteinoteka.ProductSpecifications;
import com.proteinoteka.dto.PriceHistoryDTO;
import com.proteinoteka.dto.ProductDTO;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public Page<ProductDTO> getProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String storeName,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            Pageable pageable) {

        // ← ZAMENI stari nullsLast blok sa ovim
        boolean sortByValue = pageable.getSort().stream()
                .anyMatch(o -> o.getProperty().equals("valueScore"));

        if (sortByValue) {
            // Ukloni valueScore sort, fetchuj bez sorta pa sortiraj u memoriji
            Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());

            Specification<Product> spec = buildSpec(name, storeName, brand, minPrice, maxPrice);

            List<ProductDTO> sorted = productRepository.findAll(spec, unsorted)
                    .stream()
                    .map(this::convertToDTO)
                    .sorted(Comparator.comparingDouble(
                            p -> p.valueScore() != null ? p.valueScore() : Double.MAX_VALUE))
                    .toList();

            return new PageImpl<>(sorted, pageable, sorted.size());
        }

        Specification<Product> spec = buildSpec(name, storeName, brand, minPrice, maxPrice);
        return productRepository.findAll(spec, pageable).map(this::convertToDTO);
    }

    private Specification<Product> buildSpec(String name, String storeName,
                                             String brand, Double minPrice, Double maxPrice) {
        Specification<Product> spec = Specification.where(null);
        if (name != null && !name.isEmpty())
            spec = spec.and(ProductSpecifications.hasName(name));
        if (storeName != null && !storeName.isEmpty())
            spec = spec.and(ProductSpecifications.hasStoreName(storeName));
        if (brand != null && !brand.isEmpty())
            spec = spec.and(ProductSpecifications.hasBrand(brand));
        if (minPrice != null)
            spec = spec.and(ProductSpecifications.priceGreaterThan(minPrice));
        if (maxPrice != null)
            spec = spec.and(ProductSpecifications.priceLessThan(maxPrice));
        return spec;
    }

    @GetMapping("/search")
    public List<ProductDTO> searchAutocomplete(
            @RequestParam String query,
            @RequestParam(defaultValue = "20") int size) {

        if (query == null || query.trim().length() < 2) return List.of();

        Pageable pageable = PageRequest.of(0, size);

        return productRepository
                .findByNameContainingIgnoreCase(query.trim(), pageable)  // ← već postoji!
                .stream()
                .map(this::convertToDTO)
                .sorted(Comparator.comparingDouble(
                        p -> p.valueScore() != null ? p.valueScore() : Double.MAX_VALUE))
                .toList();
    }


    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getById(@PathVariable Long id) {
        return productRepository.findById(id)
                .map(this::convertToDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/brands")
    List<String> getAllBrands(){
        return productRepository.findAllUniqueBrands();
    }

    private ProductDTO convertToDTO(Product product) {
        return new ProductDTO(
                product.getId(),
                product.getName(),
                product.getBrand(),
                product.getPrice(),
                product.getImageUrl(),
                product.getUrl(),
                product.getStore() != null ? product.getStore().getName() : "Unknown",
                product.getPackage_weight(),
                product.getFlavours(),
                product.getPriceHistories().stream()
                        .map(h -> new PriceHistoryDTO(h.getPrice(), h.getTimestamp()))
                        .sorted(Comparator.comparing(PriceHistoryDTO::timestamp).reversed())
                        .toList(),
                product.getDescription(),
                product.getNumericPrice(),
                product.getProteinPer100g(),
                product.getValueScore(),
                product.getPrimaryWeightGrams(),
                product.getSugarPer100g(),
                product.getFatPer100g(),
                product.getCaloriePer100g(),
                product.getProteinSource()
        );
    }
}
