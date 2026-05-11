package com.proteinoteka.dto;

import java.util.List;

public record WishlistSyncRequest(String email, List<Long> productIds) {}
