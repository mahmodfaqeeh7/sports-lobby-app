package com.sportslobby.vendors.api;

import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.vendors.application.VendorService;
import jakarta.validation.Valid;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class VendorController {
    private final VendorService vendorService;

    public VendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @PostMapping("/api/v1/vendors/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorSignupResponse signup(@Valid @RequestBody VendorSignupRequest request) {
        return VendorSignupResponse.from(vendorService.signup(request));
    }

    @GetMapping("/api/v1/vendor/me")
    public VendorResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return VendorResponse.from(vendorService.getMyVendor(user));
    }

    @GetMapping("/api/v1/vendor/verification-documents/{fileId}/download")
    public SignedDownloadResponse downloadVendorDocument(
        @PathVariable UUID fileId,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return SignedDownloadResponse.from(vendorService.createVendorDocumentDownload(fileId, user));
    }
}
