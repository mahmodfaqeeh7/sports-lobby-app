package com.sportslobby.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record OtpVerifyRequest(
    @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164,
    @NotBlank @Pattern(regexp = "^[0-9]{6}$") String code
) {
}
