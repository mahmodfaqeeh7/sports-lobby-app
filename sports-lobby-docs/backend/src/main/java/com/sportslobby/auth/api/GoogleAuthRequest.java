package com.sportslobby.auth.api;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.NotBlank;

public record GoogleAuthRequest(
    @NotBlank String idToken,
    @Pattern(regexp = "^\\+[1-9][0-9]{7,14}$") String phoneE164,
    Boolean acceptedTerms,
    Boolean acceptedPrivacy,
    @Size(max = 200) String deviceLabel
) {
}
