package com.proteinoteka.repository;

import com.proteinoteka.model.AffiliateLink;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AffiliateLinkRepository extends JpaRepository<AffiliateLink, Long> {
    Optional<AffiliateLink> findByStoreNameAndIsActiveTrue(String storeName);
}
