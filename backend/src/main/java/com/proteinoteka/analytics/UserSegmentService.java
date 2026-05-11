package com.proteinoteka.analytics;

import com.proteinoteka.repository.AlertJobRepository;
import com.proteinoteka.repository.WishlistItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserSegmentService {

    private final WishlistItemRepository wishlistRepo;
    private final AlertJobRepository alertJobRepo;

    public List<UserSegmentStats> buildSegments() {
        long totalUniqueEmails = wishlistRepo.countUniqueEmails();

        return List.of(
                bargainHunters(),
                impulseUsers(),
                powerUsers(totalUniqueEmails),
                highIntentUsers()
        );
    }

    // Users who set an explicit price threshold — price-sensitive, high intent
    private UserSegmentStats bargainHunters() {
        long count = wishlistRepo.countBargainHunters();
        double ctr = alertJobRepo.ctrBargainHunters();
        return new UserSegmentStats(
                "BARGAIN_HUNTERS",
                "Korisnici koji su postavili target cijenu (threshold alert)",
                count,
                round(ctr),
                ctr > 0.15
                        ? "High CTR — price threshold creates strong buy intent. Prioritize this segment."
                        : "Target price set but CTR low — threshold may be too conservative."
        );
    }

    // Users without target price — alerted on any significant drop
    private UserSegmentStats impulseUsers() {
        long count = wishlistRepo.countImpulseUsers();
        double ctr = alertJobRepo.ctrImpulseUsers();
        return new UserSegmentStats(
                "IMPULSE_USERS",
                "Korisnici bez target cijene (bilo koji značajan pad)",
                count,
                round(ctr),
                ctr < 0.10
                        ? "Low CTR without target price — consider prompting to set threshold for better relevance."
                        : "Good CTR — spontaneous drop alerts are converting well."
        );
    }

    // Users tracking 2+ products — core engaged users
    private UserSegmentStats powerUsers(long totalUniqueEmails) {
        long count = wishlistRepo.countRepeatUsers();
        double ctr = alertJobRepo.ctrPowerUsers();
        double rate = totalUniqueEmails > 0 ? (double) count / totalUniqueEmails : 0;
        return new UserSegmentStats(
                "POWER_USERS",
                "Korisnici sa 2+ aktivna alerta",
                count,
                round(ctr),
                rate > 0.25
                        ? String.format("%.0f%% of users are power users — strong retention. Invest in advanced features.", rate * 100)
                        : String.format("%.0f%% power users — growth opportunity. Encourage setting 2nd alert post-signup.", rate * 100)
        );
    }

    // Users who clicked email CTA 2+ times — highest purchase intent
    private UserSegmentStats highIntentUsers() {
        long count = alertJobRepo.countHighIntentUsers();
        return new UserSegmentStats(
                "HIGH_INTENT_USERS",
                "Korisnici koji su kliknuli email CTA 2+ puta",
                count,
                0.0, // CTR not applicable — these ARE the clickers
                count > 0
                        ? "Multi-click users have strong purchase intent. These are your best affiliate revenue drivers."
                        : "No repeat clickers yet — normal for a new system with few emails sent."
        );
    }

    private static double round(double d) {
        return Math.round(d * 10000.0) / 10000.0;
    }
}
