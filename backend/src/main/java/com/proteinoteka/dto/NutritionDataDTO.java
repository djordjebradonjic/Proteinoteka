// package com.proteinoteka.dto;

package com.proteinoteka.dto;

import lombok.Data;

@Data
public class NutritionDataDTO {
    private Double proteinPer100g;
    private Double sugarPer100g;
    private Double fatPer100g;
    private Double caloriePer100g;
    private String proteinSource;
    private Double primaryWeightGrams;
}