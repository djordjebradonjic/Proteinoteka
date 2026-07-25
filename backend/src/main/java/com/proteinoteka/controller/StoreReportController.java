package com.proteinoteka.controller;

import com.proteinoteka.dto.StoreOptionDTO;
import com.proteinoteka.dto.StoreReportDTO;
import com.proteinoteka.repository.StoreRepository;
import com.proteinoteka.service.StoreReportPdfService;
import com.proteinoteka.service.StoreReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;

/**
 * Monthly competitive-intelligence report sold to individual stores (see StoreReportService
 * for what each section means and where the numbers come from). Admin-only — this is a
 * paid deliverable assembled by us, not a self-service store dashboard.
 */
@RestController
@RequiredArgsConstructor
public class StoreReportController {

    @Value("${admin.token:}")
    private String adminToken;

    private final StoreReportService storeReportService;
    private final StoreReportPdfService storeReportPdfService;
    private final StoreRepository storeRepository;

    // Powers the store dropdown in the admin "Izveštaji" tab — every store a report can be
    // generated for.
    @GetMapping("/api/admin/store-report")
    public List<StoreOptionDTO> listStores(
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        validateAdmin(token);
        return storeRepository.findAll().stream()
                .map(s -> new StoreOptionDTO(s.getName(), s.getMarket()))
                .sorted(Comparator.comparing(StoreOptionDTO::name, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    @GetMapping("/api/admin/store-report/{storeName}")
    public StoreReportDTO getReport(
            @PathVariable String storeName,
            @RequestParam(defaultValue = "30") int days,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        validateAdmin(token);
        return generateOrNotFound(storeName, days);
    }

    @GetMapping(value = "/api/admin/store-report/{storeName}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getReportPdf(
            @PathVariable String storeName,
            @RequestParam(defaultValue = "30") int days,
            @RequestHeader(value = "X-Admin-Token", required = false) String token) {
        validateAdmin(token);
        StoreReportDTO report = generateOrNotFound(storeName, days);
        byte[] pdf = storeReportPdfService.render(report);

        String filename = "proteinoteka-izvestaj-" + storeName.toLowerCase().replaceAll("[^a-z0-9]+", "-") + ".pdf";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private StoreReportDTO generateOrNotFound(String storeName, int days) {
        try {
            return storeReportService.generateReport(storeName, days);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    private void validateAdmin(String token) {
        if (adminToken.isBlank() || !adminToken.equals(token)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
    }
}
