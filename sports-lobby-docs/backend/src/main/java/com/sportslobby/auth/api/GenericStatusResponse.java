package com.sportslobby.auth.api;

public record GenericStatusResponse(String status) {
    public static GenericStatusResponse accepted() {
        return new GenericStatusResponse("ACCEPTED");
    }
}
