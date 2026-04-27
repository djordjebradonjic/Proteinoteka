package com.proteinoteka.controller;

import com.proteinoteka.ProductSpecifications;
import com.proteinoteka.dto.CompareProductDTO;
import com.proteinoteka.dto.PriceHistoryDTO;
import com.proteinoteka.dto.ProductDTO;
import com.proteinoteka.dto.StorePriceDTO;
import com.proteinoteka.model.AffiliateLink;
import com.proteinoteka.model.ClickEvent;
import com.proteinoteka.model.Product;
import com.proteinoteka.repository.AffiliateLinkRepository;
import com.proteinoteka.repository.ClickEventRepository;
import com.proteinoteka.repository.ProductRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
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
    private final ClickEventRepository clickEventRepository;
    private final AffiliateLinkRepository affiliateLinkRepository;

    @GetMapping
    public Page<ProductDTO> getProducts(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String storeName,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) String flavour,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minPrice,
            @RequestParam(required = false) Double maxPrice,
            Pageable pageable) {

        boolean sortByValue = pageable.getSort().stream()
                .anyMatch(o -> o.getProperty().equals("valueScore"));

        if (sortByValue) {
            Pageable unsorted = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
            Specification<Product> spec = buildSpec(name, storeName, brand, flavour, category, minPrice, maxPrice);
            List<ProductDTO> sorted = productRepository.findAll(spec, unsorted)
                    .stream()
                    .map(this::convertToDTO)
                    .sorted(Comparator.comparingDouble(
                            p -> p.valueScore() != null ? p.valueScore() : Double.MAX_VALUE))
                    .toList();
            return new PageImpl<>(sorted, pageable, sorted.size());
        }

        Specification<Product> spec = buildSpec(name, storeName, brand, flavour, category, minPrice, maxPrice);
        return productRepository.findAll(spec, pageable).map(this::convertToDTO);
    }

    private Specification<Product> buildSpec(String name, String storeName, String brand,
                                             String flavour, String category,
                                             Double minPrice, Double maxPrice) {
        Specification<Product> spec = Specification.where(null);
        if (name != null && !name.isEmpty())
            spec = spec.and(ProductSpecifications.hasName(name));
        if (storeName != null && !storeName.isEmpty())
            spec = spec.and(ProductSpecifications.hasStoreName(storeName));
        if (brand != null && !brand.isEmpty())
            spec = spec.and(ProductSpecifications.hasBrand(brand));
        if (flavour != null && !flavour.isEmpty())
            spec = spec.and(ProductSpecifications.hasFlavour(flavour));
        if (category != null && !category.isEmpty())
            spec = spec.and(ProductSpecifications.hasProteinSource(category));
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

    @GetMapping("/{id}/buy")
    public ResponseEntity<Void> buyProduct(
            @PathVariable Long id,
            HttpServletRequest request) {

        Optional<Product> productOpt = productRepository.findById(id);
        if (productOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Product product = productOpt.get();
        String storeName = product.getStore() != null ? product.getStore().getName() : null;

        ClickEvent event = new ClickEvent();
        event.setProductId(id);
        event.setStoreName(storeName);
        event.setIpAddress(getClientIp(request));
        event.setUserAgent(request.getHeader("User-Agent"));
        event.setReferrer(request.getHeader("Referer"));
        clickEventRepository.save(event);

        String redirectUrl = product.getUrl();
        if (storeName != null) {
            Optional<AffiliateLink> link = affiliateLinkRepository.findByStoreNameAndIsActiveTrue(storeName);
            if (link.isPresent() && link.get().getAffiliateUrlPattern() != null) {
                String pattern = link.get().getAffiliateUrlPattern();
                redirectUrl = pattern.contains("{url}")
                        ? pattern.replace("{url}", product.getUrl())
                        : pattern;
            }
        }

        return ResponseEntity.status(HttpStatus.FOUND)
                .header(HttpHeaders.LOCATION, redirectUrl)
                .build();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isEmpty()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    @GetMapping("/by-name")
    public List<StorePriceDTO> getByName(
            @RequestParam String name,
            @RequestParam(required = false) String brand) {

        return productRepository.findSameProductAcrossStores(name, brand)
                .stream()
                .map(p -> new StorePriceDTO(
                        p.getId(),
                        p.getStore() != null ? p.getStore().getName() : "Unknown",
                        p.getPrice(),
                        p.getNumericPrice()
                ))
                .sorted(Comparator.comparingDouble(
                        p -> p.numericPrice() != null ? p.numericPrice() : Double.MAX_VALUE))
                .toList();
    }

    @GetMapping("/ids")
    List<Long> getAllIds() {
        return productRepository.findAllIds();
    }

    @GetMapping("/brands")
    List<String> getAllBrands() {
        return productRepository.findAllUniqueBrands();
    }

    @GetMapping("/flavours")
    List<String> getAllFlavours() {
        return productRepository.findAllUniqueFlavours();
    }

    @GetMapping("/compare")
    public List<CompareProductDTO> compare(@RequestParam String ids) {
        List<Long> parsed = java.util.Arrays.stream(ids.split(","))
                .map(String::trim).filter(s -> !s.isEmpty())
                .map(Long::parseLong).toList();
        List<Long> safeIds = parsed.size() > 4 ? parsed.subList(0, 4) : parsed;
        return productRepository.findAllById(safeIds).stream()
                .map(this::toCompareDTO)
                .toList();
    }

    private CompareProductDTO toCompareDTO(Product p) {
        Double pricePerKg = null;
        Double pricePerProtein = null;
        if (p.getNumericPrice() != null && p.getPrimaryWeightGrams() != null && p.getPrimaryWeightGrams() > 0) {
            pricePerKg = (p.getNumericPrice() / p.getPrimaryWeightGrams()) * 1000.0;
        }
        if (p.getNumericPrice() != null && p.getProteinPer100g() != null
                && p.getProteinPer100g() > 0 && p.getPrimaryWeightGrams() != null) {
            double totalProteinG = (p.getProteinPer100g() / 100.0) * p.getPrimaryWeightGrams();
            if (totalProteinG > 0) pricePerProtein = p.getNumericPrice() / totalProteinG;
        }
        return new CompareProductDTO(
                p.getId(), p.getName(), p.getBrand(), p.getPrice(), p.getImageUrl(),
                p.getStore() != null ? p.getStore().getName() : "Unknown",
                p.getUrl(), p.getNumericPrice(), p.getValueScore(),
                p.getProteinPer100g(), p.getSugarPer100g(), p.getFatPer100g(),
                p.getCaloriePer100g(), p.getProteinSource(), p.getPrimaryWeightGrams(),
                pricePerKg, pricePerProtein
        );
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
