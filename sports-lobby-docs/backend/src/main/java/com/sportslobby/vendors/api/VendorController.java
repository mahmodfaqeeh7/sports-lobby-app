package com.sportslobby.vendors.api;

import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.security.AuthRateLimiter;
import com.sportslobby.security.RateLimitPolicy;
import com.sportslobby.vendors.application.VendorService;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
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
    private final AuthRateLimiter rateLimiter;

    public VendorController(VendorService vendorService, AuthRateLimiter rateLimiter) {
        this.vendorService = vendorService;
        this.rateLimiter = rateLimiter;
    }

    @PostMapping("/api/v1/vendors/signup")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorSignupResponse signup(
        @Valid @RequestBody VendorSignupRequest request,
        HttpServletRequest httpRequest
    ) {
        String clientIp = httpRequest.getRemoteAddr() == null ? "unknown" : httpRequest.getRemoteAddr();
        rateLimiter.check(RateLimitPolicy.VENDOR_SIGNUP_IP, clientIp);
        rateLimiter.check(RateLimitPolicy.SIGNUP_PHONE, request.phoneE164());
        return VendorSignupResponse.from(vendorService.signup(request));
    }

    @GetMapping("/api/v1/vendor/me")
    public VendorResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return VendorResponse.from(vendorService.getMyVendor(user));
    }

    @GetMapping("/api/v1/vendor/kyc")
    public VendorKycResponse kyc(@AuthenticationPrincipal AuthenticatedUser user) {
        return VendorKycResponse.from(vendorService.getMyKyc(user));
    }

    @PostMapping("/api/v1/vendor/verification-documents/{fileId}/upload-url")
    public DocumentUploadResponse continueUpload(
        @PathVariable UUID fileId,
        @Valid @RequestBody ReplaceDocumentUploadRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return vendorService.continueDocumentUpload(fileId, request, user);
    }

    @PostMapping("/api/v1/vendor/verification-documents/{fileId}/complete")
    public VendorVerificationDocumentResponse completeUpload(
        @PathVariable UUID fileId,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return VendorVerificationDocumentResponse.from(vendorService.completeDocumentUpload(fileId, user));
    }

    @PostMapping("/api/v1/vendor/verification/resubmit")
    @ResponseStatus(HttpStatus.CREATED)
    public VendorResubmissionResponse resubmit(
        @Valid @RequestBody VendorResubmissionRequest request,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return VendorResubmissionResponse.from(vendorService.resubmitVerification(request, user));
    }

    @GetMapping("/api/v1/vendor/verification-documents/{fileId}/download")
    public SignedDownloadResponse downloadVendorDocument(
        @PathVariable UUID fileId,
        @AuthenticationPrincipal AuthenticatedUser user
    ) {
        return SignedDownloadResponse.from(vendorService.createVendorDocumentDownload(fileId, user));
    }
}
