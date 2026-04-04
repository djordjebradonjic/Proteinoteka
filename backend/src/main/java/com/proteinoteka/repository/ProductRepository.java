package com.proteinoteka.repository;

import com.proteinoteka.model.Product;
import com.proteinoteka.model.Store;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByStoreNameIgnoreCase(String storeName);

    void deleteByStore(Store store);

    List<Product> findByNameContainingIgnoreCase(String name);

    Optional<Product> findByUrl(String url);

}
