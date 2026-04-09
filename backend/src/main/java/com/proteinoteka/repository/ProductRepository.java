package com.proteinoteka.repository;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Page<Product> findByStoreNameIgnoreCase(String storeName, Pageable pageable);

    void deleteByStore(Store store);

    Page<Product> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Optional<Product> findByUrl(String url);
    Page<Product> findAll(Pageable pageable);

    @Query("SELECT DISTINCT p.brand from products p WHERE p.brand IS NOT NULL ORDER BY p.brand ASC")
    List<String> findAllUniqueBrands();

}
