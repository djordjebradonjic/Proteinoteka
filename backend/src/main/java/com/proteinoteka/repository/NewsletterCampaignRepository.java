package com.proteinoteka.repository;

import com.proteinoteka.model.NewsletterCampaign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NewsletterCampaignRepository extends JpaRepository<NewsletterCampaign, Long> {

    List<NewsletterCampaign> findTop10ByMarketOrderBySentAtDesc(String market);
}
