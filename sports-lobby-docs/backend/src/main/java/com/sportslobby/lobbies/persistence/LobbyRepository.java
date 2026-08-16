package com.sportslobby.lobbies.persistence;

import com.sportslobby.lobbies.domain.Lobby;
import com.sportslobby.lobbies.domain.LobbyDiscoveryItem;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LobbyRepository {
    void create(Lobby lobby);

    void updateDraft(Lobby lobby);

    Optional<Lobby> findById(UUID id);

    List<Lobby> findByVendorId(UUID vendorId);

    List<LobbyDiscoveryItem> discover(UUID sportId, String city, String search, Instant from, Instant to);

    Optional<LobbyDiscoveryItem> findDiscoverableById(UUID lobbyId);

    boolean hasCourtOverlap(UUID courtId, Instant startsAt, Instant endsAt, UUID exceptLobbyId);

    void publish(UUID lobbyId, Instant publishedAt);

    boolean tryReserveSeat(UUID lobbyId);

    void releaseSeat(UUID lobbyId);
}
