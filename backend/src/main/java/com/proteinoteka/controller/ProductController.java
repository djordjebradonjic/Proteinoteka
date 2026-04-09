package com.proteinoteka.controller;

import com.proteinoteka.ProductSpecifications;
import com.proteinoteka.dto.PriceHistoryDTO;
import com.proteinoteka.dto.ProductDTO;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.ProductRepository;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:3000")
public class ProductController {

    private final ProductRepository productRepository;

    @GetMapping
    public Page<ProductDTO> getProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String storeName,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            Pageable pageable){

        Specification<Product> spec = Specification.where(null);

        if (name != null && !name.isEmpty()) {
            spec = spec.and(ProductSpecifications.hasName(name));
        }
        if (storeName != null && !storeName.isEmpty()) {
            spec = spec.and(ProductSpecifications.hasStoreName(storeName));
        }
        if (brand != null && !brand.isEmpty()) {
            spec = spec.and(ProductSpecifications.hasBrand(brand));
        }
        if (minPrice != null) {
            spec = spec.and(ProductSpecifications.priceGreaterThan(minPrice));
        }
        if (maxPrice != null) {
            spec = spec.and(ProductSpecifications.priceLessThan(maxPrice));
        }

        // findAll sada prima specifikaciju i pageable
        return productRepository.findAll(spec, pageable)
                .map(this::convertToDTO);


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
                product.getNumericPrice()
        );
    }
}
