package com.fypals.FYPals.dispute;

public enum DisputeStatus {
    PENDING,   // waiting for leader action
    OPEN,      // leader accepted, poll created
    REJECTED,  // leader rejected
    RESOLVED   // poll completed, decision made
}