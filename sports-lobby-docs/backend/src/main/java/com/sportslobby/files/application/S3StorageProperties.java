package com.sportslobby.files.application;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.files.s3")
public record S3StorageProperties(String region, String endpoint, boolean pathStyleAccess) {
    public S3StorageProperties {
        if (region == null || region.isBlank()) {
            region = "us-east-1";
        }
    }
}
