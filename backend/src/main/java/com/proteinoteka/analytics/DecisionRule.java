package com.proteinoteka.analytics;

public record DecisionRule(
        DecisionFlag flag,
        Severity severity,
        String message,
        String action
) {
    public enum Severity { WARNING, SUCCESS, INFO }
}
