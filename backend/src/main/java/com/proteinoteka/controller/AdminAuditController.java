package com.proteinoteka.controller;

import com.proteinoteka.model.AdminAuditLog;
import com.proteinoteka.repository.AdminAuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Append-only trail of admin panel actions; behind AdminTokenFilter like every /api/admin path. */
@RestController
@RequestMapping("/api/admin/audit")
@RequiredArgsConstructor
public class AdminAuditController {

    private final AdminAuditLogRepository repo;

    public record AuditRequest(String action, String detail, String ip) {}

    @PostMapping
    public ResponseEntity<Void> record(@RequestBody AuditRequest req) {
        if (req.action() == null || req.action().isBlank()) return ResponseEntity.badRequest().build();
        AdminAuditLog row = new AdminAuditLog();
        row.setAction(cut(req.action(), 60));
        row.setDetail(cut(req.detail(), 500));
        row.setIp(cut(req.ip(), 64));
        repo.save(row);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public List<AdminAuditLog> latest() {
        return repo.findTop100ByOrderByCreatedAtDesc();
    }

    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
