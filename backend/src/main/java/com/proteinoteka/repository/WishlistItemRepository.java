package com.proteinoteka.repository;

import com.proteinoteka.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {

    List<WishlistItem> findByEmail(String email);

    @Modifying
    @Transactional
    @Query("DELETE FROM WishlistItem w WHERE w.email = :email")
    void deleteByEmail(@Param("email") String email);
}
