package com.sportslobby.courts.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;

public record CreateCourtRequest(
    @NotBlank @Size(max = 120) String name,
    @Size(max = 1000) String description,
    @Positive Integer defaultMinPlayers,
    @Positive Integer defaultMaxPlayers,
    @NotEmpty @Size(max = 12) List<UUID> sportIds
) {
}
