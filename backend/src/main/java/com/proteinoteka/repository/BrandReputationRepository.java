package com.proteinoteka.repository;

import com.proteinoteka.model.BrandReputation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BrandReputationRepository extends JpaRepository<BrandReputation, Long> {
    Optional<BrandReputation> findFirstByBrandNameIgnoreCase(String brandName);
}