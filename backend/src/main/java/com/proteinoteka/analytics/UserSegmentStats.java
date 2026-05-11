package com.proteinoteka.analytics;

public record UserSegmentStats(
        String segment,
        String description,
        long count,
        double ctr,            // click-through rate on sent alerts
        String growthNote      // one-line strategic note
) {}
