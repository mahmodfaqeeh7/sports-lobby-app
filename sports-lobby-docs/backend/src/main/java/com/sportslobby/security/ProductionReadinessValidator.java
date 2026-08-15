package com.sportslobby.security;

import com.sportslobby.auth.application.AuthProperties;
import com.sportslobby.auth.integration.TwilioSmsProperties;
import com.sportslobby.files.application.FileStorageProperties;
import java.util.ArrayList;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "app.production", name = "enabled", havingValue = "true")
public class ProductionReadinessValidator implements ApplicationRunner {
    private static final String DEVELOPMENT_SECRET = "dev-only-change-me-dev-only-change-me-32";

    private final AuthProperties auth;
    private final TwilioSmsProperties sms;
    private final FileStorageProperties files;
    private final RateLimitProperties rateLimit;
    private final boolean requireHttps;

    public ProductionReadinessValidator(
        AuthProperties auth,
        TwilioSmsProperties sms,
        FileStorageProperties files,
        RateLimitProperties rateLimit,
        @Value("${app.security.require-https:false}") boolean requireHttps
    ) {
        this.auth = auth;
        this.sms = sms;
        this.files = files;
        this.rateLimit = rateLimit;
        this.requireHttps = requireHttps;
    }

    @Override
    public void run(ApplicationArguments args) {
        List<String> problems = new ArrayList<>();
        if (DEVELOPMENT_SECRET.equals(auth.accessTokenSecret())) {
            problems.add("replace the development access-token secret");
        }
        if (auth.otp().testCodeEnabled()) {
            problems.add("disable the test OTP code");
        }
        if (!requireHttps) {
            problems.add("enable HTTPS enforcement");
        }
        if (!sms.enabled()) {
            problems.add("enable the SMS provider for OTP and password recovery");
        }
        if (!rateLimit.enabled()) {
            problems.add("enable authentication rate limiting");
        }
        if (!files.provider().equals("s3")) {
            problems.add("use S3-compatible private object storage for KYC evidence");
        }
        if (!problems.isEmpty()) {
            throw new IllegalStateException(
                "Production security configuration is incomplete: " + String.join("; ", problems) + "."
            );
        }
    }
}
