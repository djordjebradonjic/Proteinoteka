package com.proteinoteka.model;

public enum ScrapeStatus {
    RUNNING,
    SUCCESS,
    FAILED,
    BLOCKED,
    // Finished without an exception but found far fewer products than the store's last
    // successful run — e.g. a mid-run page load failure truncated pagination early.
    // Distinct from SUCCESS so this doesn't silently hide a partial catalog refresh.
    PARTIAL
}
