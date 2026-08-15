package com.sportslobby.vendors.api;

import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.vendors.application.VendorService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/vendors")
public class AdminVendorController {
    private final VendorService vendorService;

    public AdminVendorController(VendorService vendorService) {
        this.vendorService = vendorService;
    }

    @GetMapping("/pending")
    public List<VendorResponse> pending(@AuthenticationPrincipal AuthenticatedUser adminUser) {
        return vendorService.findPendingVendors(adminUser).stream()
            .map(VendorResponse::from)
            .toList();
    }

    @PostMapping("/{vendorId}/approve")
    public VendorResponse approve(
        @PathVariable UUID vendorId,
        @Valid @RequestBody AdminVendorDecisionRequest request,
        @AuthenticationPrincipal AuthenticatedUser adminUser
    ) {
        return VendorResponse.from(vendorService.approveVendor(vendorId, adminUser, request.reason()));
    }

    @PostMapping("/{vendorId}/reject")
    public VendorResponse reject(
        @PathVariable UUID vendorId,
        @Valid @RequestBody AdminVendorDecisionRequest request,
        @AuthenticationPrincipal AuthenticatedUser adminUser
    ) {
        return VendorResponse.from(vendorService.rejectVendor(vendorId, adminUser, request.reason()));
    }

    @GetMapping("/{vendorId}/review")
    public AdminVendorReviewResponse review(
        @PathVariable UUID vendorId,
        @AuthenticationPrincipal AuthenticatedUser adminUser
    ) {
        return AdminVendorReviewResponse.from(vendorService.getAdminReview(vendorId, adminUser));
    }

    @PostMapping("/{vendorId}/suspend")
    public VendorResponse suspend(
        @PathVariable UUID vendorId,
        @Valid @RequestBody AdminVendorDecisionRequest request,
        @AuthenticationPrincipal AuthenticatedUser adminUser
    ) {
        return VendorResponse.from(vendorService.suspendVendor(vendorId, adminUser, request.reason()));
    }

    @PostMapping("/{vendorId}/reactivate")
    public VendorResponse reactivate(
        @PathVariable UUID vendorId,
        @Valid @RequestBody AdminVendorDecisionRequest request,
        @AuthenticationPrincipal AuthenticatedUser adminUser
    ) {
        return VendorResponse.from(vendorService.reactivateVendor(vendorId, adminUser, request.reason()));
    }

    @GetMapping("/verification-documents/{fileId}/download")
    public SignedDownloadResponse downloadVerificationDocument(
        @PathVariable UUID fileId,
        @AuthenticationPrincipal AuthenticatedUser adminUser
    ) {
        return SignedDownloadResponse.from(vendorService.createAdminDocumentDownload(fileId, adminUser));
    }
}
