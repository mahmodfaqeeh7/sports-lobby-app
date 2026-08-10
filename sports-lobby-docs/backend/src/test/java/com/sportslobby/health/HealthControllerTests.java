package com.sportslobby.health;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import com.sportslobby.common.web.GlobalExceptionHandler;
import com.sportslobby.common.web.RequestIdFilter;
import com.sportslobby.security.AccessTokenService;
import com.sportslobby.security.SecurityConfig;

@WebMvcTest(HealthController.class)
@Import({GlobalExceptionHandler.class, RequestIdFilter.class, SecurityConfig.class})
class HealthControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AccessTokenService accessTokenService;

    @Test
    void healthEndpointReturnsUpAndRequestId() throws Exception {
        mockMvc.perform(get("/api/v1/health").header("X-Request-Id", "test-request-id"))
            .andExpect(status().isOk())
            .andExpect(header().string("X-Request-Id", "test-request-id"))
            .andExpect(jsonPath("$.status").value("UP"));
    }
}
