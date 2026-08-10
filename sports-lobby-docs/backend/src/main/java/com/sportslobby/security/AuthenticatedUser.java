package com.sportslobby.security;

import com.sportslobby.auth.domain.UserRole;
import java.util.Set;
import java.util.UUID;

public record AuthenticatedUser(UUID userId, Set<UserRole> roles, boolean phoneVerified) {
}
