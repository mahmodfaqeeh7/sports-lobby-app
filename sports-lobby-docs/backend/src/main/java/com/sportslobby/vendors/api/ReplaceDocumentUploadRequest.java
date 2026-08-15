package com.sportslobby.vendors.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record ReplaceDocumentUploadRequest(
    @NotBlank @Size(max = 255) String fileName,
    @NotBlank @Size(max = 120) String contentType,
    @Positive long sizeBytes
) {
}
