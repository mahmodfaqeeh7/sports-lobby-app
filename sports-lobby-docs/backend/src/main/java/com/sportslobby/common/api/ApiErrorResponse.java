package com.sportslobby.common.api;

import java.util.Map;

public record ApiErrorResponse(ErrorBody error) {

    public static ApiErrorResponse of(
        ApiErrorCode code,
        String message,
        String requestId,
        Map<String, Object> details
    ) {
        return new ApiErrorResponse(new ErrorBody(code.name(), message, requestId, details));
    }

    public record ErrorBody(
        String code,
        String message,
        String requestId,
        Map<String, Object> details
    ) {
    }
}
