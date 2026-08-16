package com.sportslobby.lobbies.api;

import com.sportslobby.courts.application.CourtImageService;
import com.sportslobby.lobbies.application.LobbyService;
import com.sportslobby.lobbies.domain.LobbyDiscoveryItem;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/lobbies")
public class LobbyDiscoveryController {
    private final LobbyService lobbyService;
    private final CourtImageService courtImageService;

    public LobbyDiscoveryController(LobbyService lobbyService, CourtImageService courtImageService) {
        this.lobbyService = lobbyService;
        this.courtImageService = courtImageService;
    }

    @GetMapping
    public List<LobbyDiscoveryResponse> discover(
        @RequestParam(required = false) UUID sportId,
        @RequestParam(required = false) String city,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to
    ) {
        return lobbyService.discover(sportId, city, search, from, to).stream().map(this::response).toList();
    }

    @GetMapping("/{lobbyId}")
    public LobbyDiscoveryResponse get(@PathVariable UUID lobbyId) {
        return response(lobbyService.getDiscoverable(lobbyId));
    }

    private LobbyDiscoveryResponse response(LobbyDiscoveryItem item) {
        var image = courtImageService.createDisplayUrl(item.courtImageFileId()).orElse(null);
        return LobbyDiscoveryResponse.from(item, image);
    }
}
