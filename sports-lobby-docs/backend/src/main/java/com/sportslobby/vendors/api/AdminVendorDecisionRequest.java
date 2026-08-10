package com.sportslobby.vendors.api;

import jakarta.validation.constraints.Size;

public record AdminVendorDecisionRequest(@Size(max = 1000) String reason) {
}
