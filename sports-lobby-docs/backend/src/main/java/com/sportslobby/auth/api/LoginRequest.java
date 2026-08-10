package com.sportslobby.auth.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LoginRequest(
    @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164,
    @NotBlank @Size(max = 200) String password,
    @Size(max = 200) String deviceLabel
) {
}
