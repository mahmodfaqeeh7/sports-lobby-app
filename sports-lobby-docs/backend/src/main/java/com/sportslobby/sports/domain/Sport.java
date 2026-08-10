package com.sportslobby.sports.domain;

import java.util.UUID;

public record Sport(UUID id, String code, String name, boolean active) {
}
