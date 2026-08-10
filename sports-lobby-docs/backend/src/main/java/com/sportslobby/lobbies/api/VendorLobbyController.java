package com.sportslobby.lobbies.api;

import com.sportslobby.lobbies.application.LobbyService;
import com.sportslobby.security.AuthenticatedUser;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/vendor/lobbies")
public class VendorLobbyController {
    private final LobbyService lobbyService;

    public VendorLobbyController(LobbyService lobbyService) {
        this.lobbyService = lobbyService;
    }

    @PostMapping
    public LobbyResponse create(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody SaveLobbyRequest request) {
        return LobbyResponse.from(lobbyService.createDraft(user, request));
    }

    @PutMapping("/{lobbyId}")
    public LobbyResponse edit(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID lobbyId, @Valid @RequestBody SaveLobbyRequest request) {
        return LobbyResponse.from(lobbyService.editDraft(user, lobbyId, request));
    }

    @PostMapping("/{lobbyId}/publish")
    public LobbyResponse publish(@AuthenticationPrincipal AuthenticatedUser user, @PathVariable UUID lobbyId) {
        return LobbyResponse.from(lobbyService.publish(user, lobbyId));
    }

    @GetMapping
    public List<LobbyResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return lobbyService.listVendorLobbies(user).stream().map(LobbyResponse::from).toList();
    }
}
