package com.sportslobby.courts.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.courts.api.CourtImageUploadRequest;
import com.sportslobby.courts.persistence.CourtRepository;
import com.sportslobby.files.application.FileStorageProperties;
import com.sportslobby.files.application.ObjectStorageService;
import com.sportslobby.files.application.SignedUpload;
import com.sportslobby.files.domain.FileAccessLevel;
import com.sportslobby.files.domain.FilePurpose;
import com.sportslobby.files.domain.FileRecord;
import com.sportslobby.files.persistence.FileRepository;
import com.sportslobby.security.AuthenticatedUser;
import com.sportslobby.vendors.application.VendorService;
import com.sportslobby.vendors.domain.Vendor;
import com.sportslobby.vendors.domain.VerificationStatus;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CourtImageServiceTests {
    private static final Instant NOW = Instant.parse("2026-08-16T10:00:00Z");
    private static final UUID USER_ID = UUID.fromString("20000000-0000-0000-0000-000000000003");
    private static final UUID VENDOR_ID = UUID.fromString("30000000-0000-0000-0000-000000000001");

    @Mock
    private VendorService vendorService;
    @Mock
    private FileRepository fileRepository;
    @Mock
    private CourtRepository courtRepository;
    @Mock
    private ObjectStorageService objectStorageService;

    private CourtImageService service;
    private AuthenticatedUser user;

    @BeforeEach
    void setUp() {
        var properties = new FileStorageProperties(
            "local",
            "sports-lobby-dev",
            "vendor-verification",
            "court-images",
            Duration.ofMinutes(10),
            Duration.ofMinutes(5),
            5 * 1024 * 1024,
            5 * 1024 * 1024,
            "http://localhost:8080",
            ".local-object-storage"
        );
        service = new CourtImageService(
            vendorService,
            fileRepository,
            courtRepository,
            objectStorageService,
            properties,
            Clock.fixed(NOW, ZoneOffset.UTC)
        );
        user = new AuthenticatedUser(USER_ID, Set.of(UserRole.VENDOR), true);
        when(vendorService.getMyVendor(user)).thenReturn(vendor());
    }

    @Test
    void createsPublicCourtImageUploadOwnedByVendor() {
        when(objectStorageService.createSignedUpload(any(), eq("sports-lobby-dev"), any(), eq("image/jpeg"), eq(2048L)))
            .thenReturn(new SignedUpload(
                "http://localhost:8080/api/v1/files/local/uploads/token",
                "PUT",
                Map.of("Content-Type", "image/jpeg"),
                NOW.plus(Duration.ofMinutes(10))
            ));

        var response = service.createUpload(
            new CourtImageUploadRequest("main court.jpg", "image/jpg", 2048),
            user
        );

        ArgumentCaptor<FileRecord> fileCaptor = ArgumentCaptor.forClass(FileRecord.class);
        verify(fileRepository).create(fileCaptor.capture());
        FileRecord file = fileCaptor.getValue();
        assertThat(file.ownerUserId()).isEqualTo(USER_ID);
        assertThat(file.ownerVendorId()).isEqualTo(VENDOR_ID);
        assertThat(file.purpose()).isEqualTo(FilePurpose.COURT_IMAGE);
        assertThat(file.accessLevel()).isEqualTo(FileAccessLevel.PUBLIC);
        assertThat(file.objectKey()).startsWith("court-images/" + VENDOR_ID + "/");
        assertThat(response.fileId()).isEqualTo(file.id());
        assertThat(response.method()).isEqualTo("PUT");
    }

    @Test
    void rejectsNonImageUploadBeforeCreatingMetadata() {
        assertThatThrownBy(() -> service.createUpload(
            new CourtImageUploadRequest("court.pdf", "application/pdf", 2048),
            user
        ))
            .isInstanceOf(ApiException.class)
            .satisfies(error -> assertThat(((ApiException) error).getCode()).isEqualTo(ApiErrorCode.VALIDATION_ERROR));
    }

    private Vendor vendor() {
        return new Vendor(
            VENDOR_ID,
            USER_ID,
            "PlayHub Jordan",
            "+962790000002",
            "vendor@sports-lobby.local",
            "JO",
            "Amman",
            "Abdoun",
            "Zahran Street",
            null,
            null,
            "Football",
            3,
            "Daily",
            VerificationStatus.APPROVED,
            null,
            NOW,
            null,
            NOW,
            NOW
        );
    }
}
