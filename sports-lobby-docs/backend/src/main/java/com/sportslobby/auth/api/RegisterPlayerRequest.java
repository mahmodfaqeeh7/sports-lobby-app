package com.sportslobby.auth.api;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterPlayerRequest(
    @NotBlank @Size(max = 100) String firstName,
    @NotBlank @Size(max = 100) String lastName,
    @NotBlank @Email @Size(max = 255) String email,
    @NotBlank @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164,
    @NotBlank @Size(min = 8, max = 200) String password,
    @Size(max = 200) String deviceLabel
) {
}
