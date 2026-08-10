package com.sportslobby.venues.api;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record CreateVenueRequest(
    @NotBlank @Size(max = 180) String name,
    @Size(max = 1000) String description,
    @NotBlank @Pattern(regexp = "^[A-Z]{2}$") String countryCode,
    @NotBlank @Size(max = 120) String city,
    @Size(max = 120) String area,
    @NotBlank @Size(max = 255) String addressLine,
    @DecimalMin("-90.0") @DecimalMax("90.0") BigDecimal latitude,
    @DecimalMin("-180.0") @DecimalMax("180.0") BigDecimal longitude,
    @NotBlank @Size(max = 80) String timezone,
    @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String contactPhone
) {
}
