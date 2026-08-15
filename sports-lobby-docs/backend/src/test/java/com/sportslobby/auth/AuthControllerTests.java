package com.sportslobby.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sportslobby.auth.domain.OtpPurpose;
import com.sportslobby.auth.integration.OtpSender;
import com.sportslobby.auth.integration.PasswordResetSender;
import com.sportslobby.auth.integration.GoogleIdentity;
import com.sportslobby.auth.integration.GoogleIdentityVerifier;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.web.servlet.MockMvc;

@ActiveProfiles("test")
@SpringBootTest
@AutoConfigureMockMvc
@Sql(scripts = "/auth-test-schema.sql")
class AuthControllerTests {
    private final MockMvc mockMvc;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final CapturingOtpSender otpSender;
    private final CapturingPasswordResetSender passwordResetSender;

    @Autowired
    AuthControllerTests(
        MockMvc mockMvc,
        ObjectMapper objectMapper,
        JdbcTemplate jdbcTemplate,
        CapturingOtpSender otpSender,
        CapturingPasswordResetSender passwordResetSender
    ) {
        this.mockMvc = mockMvc;
        this.objectMapper = objectMapper;
        this.jdbcTemplate = jdbcTemplate;
        this.otpSender = otpSender;
        this.passwordResetSender = passwordResetSender;
    }

    @Test
    void registerCreatesPlayerAndReturnsTokens() throws Exception {
        JsonNode response = register("+962790000001", "player1@example.com", "StrongPass123");

        assertThat(response.path("user").path("phoneVerified").asBoolean()).isFalse();
        assertThat(response.path("tokens").path("accessToken").asText()).isNotBlank();
        assertThat(response.path("tokens").path("refreshToken").asText()).isNotBlank();
        assertThat(otpSender.lastCode).matches("[0-9]{6}");

        String passwordHash = jdbcTemplate.queryForObject(
            "SELECT password_hash FROM users WHERE phone_e164 = ?",
            String.class,
            "+962790000001"
        );
        assertThat(passwordHash).isNotEqualTo("StrongPass123");
        assertThat(passwordHash).startsWith("$2");
        Integer legalConsentCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM user_legal_consents WHERE user_id = ?",
            Integer.class,
            java.util.UUID.fromString(response.path("user").path("id").asText())
        );
        assertThat(legalConsentCount).isEqualTo(2);
    }

    @Test
    void unverifiedUserCanCorrectPhoneWithFreshAuthenticatedSession() throws Exception {
        JsonNode response = register("+962790000011", "player11@example.com", "StrongPass123");
        String accessToken = response.path("tokens").path("accessToken").asText();

        mockMvc.perform(patch("/api/v1/me/unverified-phone")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000012",
                    "currentPassword", "StrongPass123"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.phoneE164").value("+962790000012"));

        assertThat(otpSender.lastPhone).isEqualTo("+962790000012");
        Integer updated = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE phone_e164 = '+962790000012' AND phone_verified_at IS NULL",
            Integer.class
        );
        assertThat(updated).isEqualTo(1);
    }

    @Test
    void googleSignInCreatesExternalIdentityAndStillRequiresPhoneVerification() throws Exception {
        JsonNode response = postJson("/api/v1/auth/google", Map.of(
            "idToken", "valid-google-token",
            "phoneE164", "+962790000013",
            "acceptedTerms", true,
            "acceptedPrivacy", true,
            "deviceLabel", "JUnit Google"
        ), 200);

        assertThat(response.path("user").path("email").asText()).isEqualTo("google@example.com");
        assertThat(response.path("user").path("phoneVerified").asBoolean()).isFalse();
        Integer identities = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM external_identities WHERE provider = 'GOOGLE'",
            Integer.class
        );
        assertThat(identities).isEqualTo(1);
    }

    @Test
    void registerRejectsDuplicatePhone() throws Exception {
        register("+962790000002", "player2@example.com", "StrongPass123");

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "firstName", "Second",
                    "lastName", "Player",
                    "email", "second@example.com",
                    "phoneE164", "+962790000002",
                    "password", "StrongPass123",
                    "acceptedTerms", true,
                    "acceptedPrivacy", true
                ))))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.error.code").value("CONFLICT"));
    }

    @Test
    void loginRejectsInvalidPassword() throws Exception {
        register("+962790000003", "player3@example.com", "StrongPass123");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000003",
                    "password", "WrongPass123"
                ))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
    }

    @Test
    void otpVerifyMarksPhoneAsVerified() throws Exception {
        register("+962790000004", "player4@example.com", "StrongPass123");

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000004",
                    "code", otpSender.lastCode
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.phoneVerified").value(true));

        Integer verifiedCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM users WHERE phone_e164 = ? AND phone_verified_at IS NOT NULL",
            Integer.class,
            "+962790000004"
        );
        assertThat(verifiedCount).isEqualTo(1);
    }

    @Test
    void testOtpVerifiesPhoneWhenChallengeExists() throws Exception {
        register("+962790000014", "player14@example.com", "StrongPass123");

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000014",
                    "code", "999999"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.phoneVerified").value(true));
    }

    @Test
    void testOtpDoesNotVerifyWithoutChallenge() throws Exception {
        mockMvc.perform(post("/api/v1/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000015",
                    "code", "999999"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void wrongOtpIsRejected() throws Exception {
        register("+962790000005", "player5@example.com", "StrongPass123");

        mockMvc.perform(post("/api/v1/auth/otp/verify")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000005",
                    "code", "000000"
                ))))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"));
    }

    @Test
    void refreshRotatesRefreshTokenAndRejectsReuse() throws Exception {
        JsonNode registerResponse = register("+962790000006", "player6@example.com", "StrongPass123");
        String firstRefreshToken = registerResponse.path("tokens").path("refreshToken").asText();

        JsonNode refreshResponse = postJson("/api/v1/auth/refresh", Map.of("refreshToken", firstRefreshToken), 200);
        String secondRefreshToken = refreshResponse.path("tokens").path("refreshToken").asText();
        assertThat(secondRefreshToken).isNotEqualTo(firstRefreshToken);

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("refreshToken", firstRefreshToken))))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error.code").value("UNAUTHENTICATED"));
    }

    @Test
    void logoutRevokesRefreshToken() throws Exception {
        JsonNode registerResponse = register("+962790000007", "player7@example.com", "StrongPass123");
        String refreshToken = registerResponse.path("tokens").path("refreshToken").asText();

        postJson("/api/v1/auth/logout", Map.of("refreshToken", refreshToken, "allDevices", false), 200);

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("refreshToken", refreshToken))))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotPasswordResetChangesPasswordAndRevokesSessions() throws Exception {
        JsonNode registerResponse = register("+962790000008", "player8@example.com", "StrongPass123");
        String refreshToken = registerResponse.path("tokens").path("refreshToken").asText();

        postJson("/api/v1/auth/password/forgot", Map.of("phoneE164", "+962790000008"), 200);
        assertThat(passwordResetSender.lastToken).isNotBlank();

        postJson("/api/v1/auth/password/reset", Map.of(
            "resetToken", passwordResetSender.lastToken,
            "newPassword", "NewStrongPass123"
        ), 200);

        mockMvc.perform(post("/api/v1/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of("refreshToken", refreshToken))))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000008",
                    "password", "StrongPass123"
                ))))
            .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(Map.of(
                    "phoneE164", "+962790000008",
                    "password", "NewStrongPass123"
                ))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.tokens.accessToken").isNotEmpty());
    }

    private JsonNode register(String phoneE164, String email, String password) throws Exception {
        return postJson("/api/v1/auth/register", Map.of(
            "firstName", "Test",
            "lastName", "Player",
            "email", email,
            "phoneE164", phoneE164,
            "password", password,
            "deviceLabel", "JUnit",
            "acceptedTerms", true,
            "acceptedPrivacy", true
        ), 201);
    }

    private JsonNode postJson(String path, Map<String, Object> body, int expectedStatus) throws Exception {
        String response = mockMvc.perform(post(path)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json(body)))
            .andExpect(status().is(expectedStatus))
            .andReturn()
            .getResponse()
            .getContentAsString();
        return objectMapper.readTree(response);
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    @TestConfiguration
    static class TestAuthDeliveryConfig {
        @Bean
        @Primary
        CapturingOtpSender capturingOtpSender() {
            return new CapturingOtpSender();
        }

        @Bean
        @Primary
        CapturingPasswordResetSender capturingPasswordResetSender() {
            return new CapturingPasswordResetSender();
        }

        @Bean
        @Primary
        GoogleIdentityVerifier testGoogleIdentityVerifier() {
            return idToken -> new GoogleIdentity("google-subject", "google@example.com", "Google", "Player");
        }
    }

    static class CapturingOtpSender implements OtpSender {
        String lastPhone;
        String lastCode;
        OtpPurpose lastPurpose;

        @Override
        public void send(String phoneE164, String code, OtpPurpose purpose) {
            this.lastPhone = phoneE164;
            this.lastCode = code;
            this.lastPurpose = purpose;
        }
    }

    static class CapturingPasswordResetSender implements PasswordResetSender {
        String lastPhone;
        String lastToken;

        @Override
        public void send(String phoneE164, String resetToken) {
            this.lastPhone = phoneE164;
            this.lastToken = resetToken;
        }
    }
}
