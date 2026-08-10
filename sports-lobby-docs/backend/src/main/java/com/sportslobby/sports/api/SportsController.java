package com.sportslobby.sports.api;

import com.sportslobby.sports.persistence.SportRepository;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/sports")
public class SportsController {
    private final SportRepository sportRepository;

    public SportsController(SportRepository sportRepository) {
        this.sportRepository = sportRepository;
    }

    @GetMapping
    public List<SportResponse> list() {
        return sportRepository.findActive().stream().map(SportResponse::from).toList();
    }
}
