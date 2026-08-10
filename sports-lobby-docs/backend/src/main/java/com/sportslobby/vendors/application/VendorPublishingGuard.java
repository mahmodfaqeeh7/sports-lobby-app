package com.sportslobby.vendors.application;

import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.vendors.domain.VerificationStatus;
import com.sportslobby.vendors.domain.Vendor;
import com.sportslobby.vendors.persistence.VendorRepository;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class VendorPublishingGuard {
    private final VendorRepository vendorRepository;

    public VendorPublishingGuard(VendorRepository vendorRepository) {
        this.vendorRepository = vendorRepository;
    }

    public void requireCanPublish(UUID vendorId) {
        Vendor vendor = vendorRepository.findById(vendorId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, ApiErrorCode.RESOURCE_NOT_FOUND, "Vendor not found."));

        if (vendor.verificationStatus() != VerificationStatus.APPROVED) {
            throw new ApiException(
                HttpStatus.FORBIDDEN,
                ApiErrorCode.VENDOR_NOT_APPROVED,
                "Vendor must be approved before publishing."
            );
        }
    }
}
