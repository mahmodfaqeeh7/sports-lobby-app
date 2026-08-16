package com.sportslobby.courts.api;

import com.sportslobby.courts.application.CourtImageService;
import com.sportslobby.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vendor/court-images")
public class VendorCourtImageController {
    private final CourtImageService courtImageService;

    public VendorCourtImageController(CourtImageService courtImageService) {
        this.courtImageService = courtImageService;
    }

    @PostMapping("/upload-url")
    @ResponseStatus(HttpStatus.CREATED)
    public CourtImageUploadResponse createUpload(
        @Valid @RequestBody CourtImageUploadRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return courtImageService.createUpload(request, user);
    }

    @PostMapping("/{fileId}/complete")
    public CourtImageResponse completeUpload(
        @PathVariable UUID fileId,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return CourtImageResponse.from(courtImageService.completeUpload(fileId, user));
    }
}
