package com.sportslobby.vendors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportslobby.auth.domain.UserAccount;
import com.sportslobby.auth.domain.UserRole;
import com.sportslobby.auth.domain.UserStatus;
import com.sportslobby.common.api.ApiErrorCode;
import com.sportslobby.common.api.ApiException;
import com.sportslobby.security.AccessTokenService;
import com.sportslobby.vendors.application.VendorPublishingGuard;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Sql(scripts = {"/auth-test-schema.sql", "/vendor-test-schema.sql"})
class VendorControllerTests {
    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final AccessTokenService accessTokenService;
    private final VendorPublishingGuard publishingGuard;

    @Autowired
    VendorControllerTests(
        MockMvc mockMvc,
        ObjectMapper objectMapper,
        JdbcTemplate jdbcTemplate,
        AccessTokenService accessTokenService,
        VendorPublishingGuard publishingGuard
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.accessTokenService = accessTokenService;
        this.publishingGuard = publishingGuard;
    }

    @Test
    void vendorSignupCreatesPendingVendorSubmissionAndPrivateUpload() throws Exception {
        JsonNode response = signup("+962790001001", "vendor1@example.com");

        assertThat(response.path("user").path("roles").toString()).contains("VENDOR");
        assertThat(response.path("vendor").path("verificationStatus").asText()).isEqualTo("PENDING");
        assertThat(response.path("verificationSubmission").path("status").asText()).isEqualTo("PENDING");
        assertThat(response.path("documentUploads").get(0).path("uploadUrl").asText()).contains("signed=upload");

        Integer vendorCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM vendors WHERE verification_status = 'PENDING'",
            Integer.class
        );
        Integer privateFileCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM files WHERE purpose = 'VENDOR_VERIFICATION_DOCUMENT' AND access_level = 'PRIVATE'",
            Integer.class
        );
        assertThat(vendorCount).isEqualTo(1);
        assertThat(privateFileCount).isEqualTo(1);
    }

    @Test
    void vendorSignupPhoneCanBeVerifiedWithTestOtp() throws Exception {
        signup("+962790001007", "vendor7@example.com");

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790001007",
                    "code", "999999"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.phoneVerified").value(true))
            .andExpect(jsonPath("$.roles[0]").value("VENDOR"));
    }

    @Test
    void vendorCanDownloadOwnDocumentButNotAnotherVendorDocument() throws Exception {
        JsonNode first = signup("+962790001002", "vendor2@example.com");
        JsonNode second = signup("+962790001003", "vendor3@example.com");
        String firstAccessToken = first.path("tokens").path("accessToken").asText();
        String secondFileId = second.path("documentUploads").get(0).path("fileId").asText();

        mockMvc.perform(get("/api/v1/vendor/verification-documents/{fileId}/download", secondFileId)
                .header("Authorization", "Bearer " + firstAccessToken))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error.code").value("RESOURCE_NOT_FOUND"));

        String firstFileId = first.path("documentUploads").get(0).path("fileId").asText();
        mockMvc.perform(get("/api/v1/vendor/verification-documents/{fileId}/download", firstFileId)
                .header("Authorization", "Bearer " + firstAccessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.downloadUrl").isNotEmpty());
    }

    @Test
    void adminCanApprovePendingVendorAndPublishingGuardAllowsIt() throws Exception {
        JsonNode signup = signup("+962790001004", "vendor4@example.com");
        UUID vendorId = UUID.fromString(signup.path("vendor").path("id").asText());
        String adminToken = createAdminAccessToken();

        assertThatThrownBy(() -> publishingGuard.requireCanPublish(vendorId))
            .isInstanceOf(ApiException.class)
            .satisfies(exception -> assertThat(((ApiException) exception).getCode()).isEqualTo(ApiErrorCode.VENDOR_NOT_APPROVED));

        mockMvc.perform(post("/api/v1/admin/vendors/{vendorId}/approve", vendorId)
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("reason", "Verified documents"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verificationStatus").value("APPROVED"));

        publishingGuard.requireCanPublish(vendorId);
        Integer auditCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM admin_audit_events WHERE action = 'VENDOR_APPROVED'",
            Integer.class
        );
        assertThat(auditCount).isEqualTo(1);
    }

    @Test
    void adminRejectRequiresReasonAndStoresDecisionHistory() throws Exception {
        JsonNode signup = signup("+962790001005", "vendor5@example.com");
        String adminToken = createAdminAccessToken();

        mockMvc.perform(post("/api/v1/admin/vendors/{vendorId}/reject", signup.path("vendor").path("id").asText())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("reason", ""))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));

        mockMvc.perform(post("/api/v1/admin/vendors/{vendorId}/reject", signup.path("vendor").path("id").asText())
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("reason", "License document is unreadable"))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.verificationStatus").value("REJECTED"));

        Integer rejectedSubmissions = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM vendor_verification_submissions WHERE status = 'REJECTED' AND decision_reason IS NOT NULL",
            Integer.class
        );
        assertThat(rejectedSubmissions).isEqualTo(1);
    }

    @Test
    void nonAdminCannotApproveVendor() throws Exception {
        JsonNode signup = signup("+962790001006", "vendor6@example.com");
        String vendorToken = signup.path("tokens").path("accessToken").asText();

        mockMvc.perform(post("/api/v1/admin/vendors/{vendorId}/approve", signup.path("vendor").path("id").asText())
                .header("Authorization", "Bearer " + vendorToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("reason", "Nope"))))
            .andExpect(status().isForbidden());
    }

    private JsonNode signup(String phoneE164, String email) throws Exception {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("firstName", "Vendor");
        body.put("lastName", "Owner");
        body.put("email", email);
        body.put("phoneE164", phoneE164);
        body.put("password", "StrongPass123");
        body.put("deviceLabel", "JUnit");
        body.put("businessName", "Amman Sports Courts");
        body.put("contactPhone", phoneE164);
        body.put("contactEmail", email);
        body.put("countryCode", "JO");
        body.put("city", "Amman");
        body.put("area", "Khalda");
        body.put("addressLine", "Main Street 1");
        body.put("latitude", 31.9539);
        body.put("longitude", 35.9106);
        body.put("supportedSports", "Football, Basketball");
        body.put("venueCountEstimate", 1);
        body.put("openingHours", "Daily 08:00-23:00");
        body.put("verificationDocuments", new Object[] {
            Map.of(
                "documentType", "BUSINESS_LICENSE",
                "fileName", "license.pdf",
                "contentType", "application/pdf",
                "sizeBytes", 1024
            )
        });

        String response = mockMvc.perform(post("/api/v1/vendors/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)))
            .andExpect(status().isCreated())
            .andReturn()
            .getResponse()
            .getContentAsString();
        return objectMapper.readTree(response);
    }

    private String createAdminAccessToken() {
        UUID adminUserId = UUID.randomUUID();
        jdbcTemplate.update(
            """
            INSERT INTO users (id, first_name, last_name, email, phone_e164, password_hash)
            VALUES (?, 'Admin', 'User', ?, ?, 'not-used')
            """,
            adminUserId,
            adminUserId + "@example.com",
            "+96278" + adminUserId.toString().replace("-", "").substring(0, 9)
        );
        jdbcTemplate.update("INSERT INTO user_roles (user_id, role) VALUES (?, 'ADMIN')", adminUserId);
        UserAccount admin = new UserAccount(
            adminUserId,
            "Admin",
            "User",
            adminUserId + "@example.com",
            "+962780000000",
            Instant.now(),
            null,
            UserStatus.ACTIVE,
            Set.of(UserRole.ADMIN)
        );
        return accessTokenService.issue(admin).token();
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
