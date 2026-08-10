package com.sportslobby.auth.integration;

import com.sportslobby.auth.domain.OtpPurpose;
import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriUtils;

@Component
@ConditionalOnProperty(prefix = "app.sms.twilio", name = "enabled", havingValue = "true")
public class TwilioOtpSender implements OtpSender {
    private final RestClient restClient;
    private final TwilioSmsProperties properties;

    public TwilioOtpSender(TwilioSmsProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
            .baseUrl(
                "https://api.twilio.com/2010-04-01/Accounts/"
                    + UriUtils.encodePathSegment(properties.accountSid(), StandardCharsets.UTF_8)
            )
            .defaultHeaders(headers -> headers.setBasicAuth(properties.accountSid(), properties.authToken()))
            .build();
    }

    @Override
    public void send(String phoneE164, String code, OtpPurpose purpose) {
        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("To", phoneE164);
        form.add("Body", messageFor(code, purpose));
        if (properties.usesMessagingService()) {
            form.add("MessagingServiceSid", properties.messagingServiceSid());
        } else {
            form.add("From", properties.fromNumber());
        }

        try {
            restClient.post()
                .uri("/Messages.json")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(form)
                .retrieve()
                .toBodilessEntity();
        } catch (RestClientException exception) {
            throw new IllegalStateException("OTP SMS could not be sent.", exception);
        }
    }

    private String messageFor(String code, OtpPurpose purpose) {
        return "Your Sports Lobby verification code is " + code + ". It expires soon.";
    }
}
