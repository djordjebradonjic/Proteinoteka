package com.proteinoteka.controller;

import com.proteinoteka.model.ProductGroup;
import com.proteinoteka.service.ProductGroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/groups")
@RequiredArgsConstructor
@CrossOrigin(origins = {
        "http://localhost:3000",
        "https://proteinoteka.rs",
        "https://www.proteinoteka.rs"
})
public class ProductGroupController {

    private final ProductGroupService productGroupService;

    /** Run matching algorithm and auto-create groups. Safe to re-run — skips products already in a group. */
    @PostMapping("/auto-generate")
    public ResponseEntity<Map<String, Object>> autoGenerate() {
        return ResponseEntity.ok(productGroupService.autoGenerateGroups());
    }

    /** List all groups with their members, sorted by store count descending. */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listGroups() {
        return ResponseEntity.ok(productGroupService.listGroups());
    }

    /** Delete a group — unassigns all products so they can be re-grouped. */
    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long groupId) {
        productGroupService.deleteGroup(groupId);
        return ResponseEntity.noContent().build();
    }

    /** Manually create a group from specific product IDs. */
    @PostMapping("/confirm")
    public ResponseEntity<ProductGroup> confirmGroup(@RequestBody ConfirmRequest body) {
        return ResponseEntity.ok(productGroupService.confirmGroup(body.productIds(), body.canonicalName()));
    }

    record ConfirmRequest(List<Long> productIds, String canonicalName) {}
}
