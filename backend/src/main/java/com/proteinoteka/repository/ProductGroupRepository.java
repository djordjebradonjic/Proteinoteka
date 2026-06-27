package com.proteinoteka.repository;

import com.proteinoteka.model.ProductGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductGroupRepository extends JpaRepository<ProductGroup, Long> {
    List<ProductGroup> findByBrandIgnoreCaseAndMarket(String brand, String market);
}
