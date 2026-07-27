package com.proteinoteka.dto;

public record ValueScoreBreakdown(Double valueForMoney,
                                   Double proteinPurity,
                                   Double absorption,
                                   Double ingredients,
                                   Boolean beefCollagenFiller,
                                   Double total) {
}
