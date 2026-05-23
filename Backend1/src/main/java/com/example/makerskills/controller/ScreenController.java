package com.example.makerskills.controller;

import com.example.makerskills.dto.ScreenRequestDTO;
import com.example.makerskills.dto.ScreenResponseDTO;
import com.example.makerskills.entity.Robot;
import com.example.makerskills.entity.Screen;
import com.example.makerskills.entity.User;
import com.example.makerskills.repository.RobotRepository;
import com.example.makerskills.repository.ScreenRepository;
import com.example.makerskills.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/screens")
public class ScreenController {

    private final ScreenRepository screenRepository;
    private final RobotRepository robotRepository;
    private final UserRepository userRepository;

    public ScreenController(
            ScreenRepository screenRepository,
            RobotRepository robotRepository,
            UserRepository userRepository
    ) {
        this.screenRepository = screenRepository;
        this.robotRepository = robotRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<ScreenResponseDTO> list() {
        return screenRepository.findAllWithRobot().stream().map(this::toDto).toList();
    }

    @PostMapping
    public ResponseEntity<ScreenResponseDTO> create(@RequestBody ScreenRequestDTO body) {
        if (body == null || !StringUtils.hasText(body.getName()) || !StringUtils.hasText(body.getRobot())
                || !StringUtils.hasText(body.getAddress())) {
            throw new ResponseStatusException(BAD_REQUEST, "name, robot and address are required.");
        }
        Robot robot = robotRepository.findByNom(body.getRobot().trim())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Unknown robot: " + body.getRobot().trim()));

        String label = body.getName().trim();
        User creator = null;
        if (body.getUserId() != null) {
            creator = userRepository.findById(body.getUserId()).orElse(null);
        }
        Screen screen = Screen.builder()
                .nom(label)
                .robot(robot)
                .address(body.getAddress().trim())
                .latitude(body.getLatitude())
                .longitude(body.getLongitude())
                .createdBy(creator)
                .build();
        Screen saved = screenRepository.save(screen);
        return ResponseEntity.ok(toDto(saved));
    }

    @PutMapping("/{id}")
    public ScreenResponseDTO update(@PathVariable UUID id, @RequestBody ScreenRequestDTO body) {
        if (body == null || !StringUtils.hasText(body.getName()) || !StringUtils.hasText(body.getRobot())
                || !StringUtils.hasText(body.getAddress())) {
            throw new ResponseStatusException(BAD_REQUEST, "name, robot and address are required.");
        }
        Robot robot = robotRepository.findByNom(body.getRobot().trim())
                .orElseThrow(() -> new ResponseStatusException(BAD_REQUEST, "Unknown robot: " + body.getRobot().trim()));

        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Screen not found"));
        String label = body.getName().trim();
        screen.setNom(label);
        screen.setRobot(robot);
        screen.setAddress(body.getAddress().trim());
        screen.setLatitude(body.getLatitude());
        screen.setLongitude(body.getLongitude());
        if (body.getUserId() != null) {
            screen.setCreatedBy(userRepository.findById(body.getUserId()).orElse(null));
        }
        return toDto(screenRepository.save(screen));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> delete(@PathVariable UUID id) {
        if (!screenRepository.existsById(id)) {
            throw new ResponseStatusException(NOT_FOUND, "Screen not found");
        }
        screenRepository.deleteById(id);
        return ResponseEntity.ok("Screen deleted");
    }

    private ScreenResponseDTO toDto(Screen s) {
        Long uid = null;
        String uName = null;
        if (s.getCreatedBy() != null) {
            User u = s.getCreatedBy();
            uid = u.getId();
            String fn = u.getFirstName() != null ? u.getFirstName() : "";
            String ln = u.getLastName() != null ? u.getLastName() : "";
            uName = (fn + " " + ln).trim();
            if (uName.isEmpty()) {
                uName = u.getEmail();
            }
        }
        return ScreenResponseDTO.builder()
                .id(s.getId())
                .name(s.getNom())
                .robot(s.getRobot() != null ? s.getRobot().getNom() : null)
                .address(s.getAddress())
                .latitude(s.getLatitude())
                .longitude(s.getLongitude())
                .userId(uid)
                .userDisplayName(uName)
                .build();
    }
}
