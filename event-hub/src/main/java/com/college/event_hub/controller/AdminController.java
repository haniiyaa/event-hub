package com.college.event_hub.controller;

import com.college.event_hub.dto.AdminClubResponse;
import com.college.event_hub.dto.AdminRoleUpdateRequest;
import com.college.event_hub.dto.ClubJoinRequestResponse;
import com.college.event_hub.dto.JoinRequestDecisionRequest;
import com.college.event_hub.dto.ClubStatusUpdateRequest;
import com.college.event_hub.dto.EventSummaryResponse;
import com.college.event_hub.dto.UserResponse;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.RequestType;
import com.college.event_hub.model.ClubJoinRequest.Status;
import com.college.event_hub.model.Event;
import com.college.event_hub.model.User;
import com.college.event_hub.service.ClubJoinRequestService;
import com.college.event_hub.service.ClubService;
import com.college.event_hub.service.EventService;
import com.college.event_hub.service.UserService;
import jakarta.validation.Valid;
import java.util.EnumSet;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/admin")
@Validated
public class AdminController {
    
    @Autowired
    private UserService userService;

    @Autowired
    private ClubService clubService;

    @Autowired
    private EventService eventService;

    @Autowired
    private ClubJoinRequestService joinRequestService;

    // Get all users
    @GetMapping("/users")
    public ResponseEntity<List<UserResponse>> getAllUsers(Authentication auth) {
    requireSuperAdmin(auth);

        List<UserResponse> users = userService.findAll().stream()
            .sorted(Comparator.comparing(User::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(UserResponse::from)
            .collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }
    
    // Promote student to club admin
    @PostMapping("/promote-club-admin/{userId}")
    public ResponseEntity<UserResponse> promoteToClubAdmin(@PathVariable Long userId, Authentication auth) {
        User admin = requireSuperAdmin(auth);
        guardAgainstSelfModification(admin, userId);

        User updatedUser = userService.promoteToClubAdmin(userId);
        return ResponseEntity.ok(UserResponse.from(updatedUser));
    }
    
    // Change user role
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<UserResponse> changeUserRole(
        @PathVariable Long userId,
        @Valid @RequestBody AdminRoleUpdateRequest request,
        Authentication auth
    ) {
        User admin = requireSuperAdmin(auth);
        guardAgainstSelfModification(admin, userId);

        User user = userService.findById(userId);
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        user.setRole(request.toRoleEnum());
        User updatedUser = userService.updateUser(user);
        return ResponseEntity.ok(UserResponse.from(updatedUser));
    }

    @GetMapping("/clubs")
    public ResponseEntity<List<AdminClubResponse>> listClubs(
        @RequestParam(value = "status", required = false) List<String> statusParams,
        Authentication auth
    ) {
        requireSuperAdmin(auth);

        List<Club> clubs;
        if (statusParams == null || statusParams.isEmpty()) {
            clubs = clubService.findAll();
        } else {
            EnumSet<Club.Status> statuses = EnumSet.noneOf(Club.Status.class);
            for (String param : statusParams) {
                if (param == null) {
                    continue;
                }
                String[] splitValues = param.split(",");
                for (String rawValue : splitValues) {
                    String value = rawValue.trim();
                    if (value.isEmpty()) {
                        continue;
                    }
                    try {
                        statuses.add(Club.Status.valueOf(value.toUpperCase()));
                    } catch (IllegalArgumentException ex) {
                        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value: " + value);
                    }
                }
            }

            clubs = clubService.findByStatuses(statuses);
        }

        List<AdminClubResponse> payload = clubs.stream()
            .sorted(Comparator.comparing(Club::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
            .map(AdminClubResponse::from)
            .collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @GetMapping("/clubs/{clubId}/events")
    public ResponseEntity<List<EventSummaryResponse>> listClubEvents(
        @PathVariable Long clubId,
        Authentication auth
    ) {
        requireSuperAdmin(auth);

        Club club = clubService.findById(clubId);
        if (club == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found");
        }

        List<Event> events = eventService.findByClubId(clubId);
        List<EventSummaryResponse> payload = events.stream()
            .sorted(Comparator.comparing(Event::getEventDate, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(EventSummaryResponse::from)
            .collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @PutMapping("/clubs/{clubId}/status")
    public ResponseEntity<AdminClubResponse> updateClubStatus(
        @PathVariable Long clubId,
        @Valid @RequestBody ClubStatusUpdateRequest request,
        Authentication auth
    ) {
        requireSuperAdmin(auth);

        if (request == null || request.getStatus() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }

        Club club = clubService.findById(clubId);
        if (club == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Club not found");
        }

        String normalized = request.getStatus().trim();
        if (normalized.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Status is required");
        }

        Club.Status nextStatus;
        try {
            nextStatus = Club.Status.valueOf(normalized.toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
        }

        if (club.getStatus() != nextStatus) {
            club.setStatus(nextStatus);
            club = clubService.updateClub(club);
        }

        return ResponseEntity.ok(AdminClubResponse.from(club));
    }

    @GetMapping("/club-requests")
    public ResponseEntity<?> listClubCreationRequests(
        @RequestParam(value = "status", required = false) String status,
        Authentication auth
    ) {
        requireSuperAdmin(auth);

        List<ClubJoinRequest> requests;
        if (status != null) {
            Status parsed;
            try {
                parsed = Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException ex) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid status value");
            }
            requests = joinRequestService.findByTypeAndStatus(RequestType.CREATE_CLUB, parsed);
        } else {
            requests = joinRequestService.findByTypeAndStatuses(RequestType.CREATE_CLUB, EnumSet.of(Status.PENDING));
        }

        List<ClubJoinRequestResponse> payload = requests.stream()
            .map(ClubJoinRequestResponse::from)
            .collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @PostMapping("/club-requests/{requestId}/approve")
    public ResponseEntity<?> approveClubCreation(@PathVariable Long requestId, Authentication auth) {
        User admin = requireSuperAdmin(auth);

        ClubJoinRequest request = joinRequestService.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (request.getType() != RequestType.CREATE_CLUB) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not a club creation request");
        }

        if (request.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }

        User requester = request.getRequester();
        if (requester == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Requester is missing");
        }

    if (clubService.hasActiveClub(requester.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Requester already manages a club");
        }

        if (requester.getRole() == User.Role.STUDENT) {
            requester = userService.promoteToClubAdmin(requester.getId());
        }

        Club club = new Club();
        club.setName(request.getRequestedName());
        club.setDescription(request.getRequestedDescription());
        club.setAdmin(requester);

        Club createdClub = clubService.createClub(club);
        ClubJoinRequest approved = joinRequestService.approveClubCreationRequest(requestId, admin, createdClub);

        return ResponseEntity.ok(ClubJoinRequestResponse.from(approved));
    }

    @PostMapping("/club-requests/{requestId}/reject")
    public ResponseEntity<?> rejectClubCreation(
        @PathVariable Long requestId,
        @Valid @RequestBody(required = false) JoinRequestDecisionRequest decisionRequest,
        Authentication auth
    ) {
        User admin = requireSuperAdmin(auth);

        ClubJoinRequest request = joinRequestService.findById(requestId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));

        if (request.getType() != RequestType.CREATE_CLUB) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Request is not a club creation request");
        }

        if (request.getStatus() != Status.PENDING) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Request is not pending");
        }

        String message = decisionRequest != null ? decisionRequest.getMessage() : null;
        ClubJoinRequest rejected = joinRequestService.rejectRequest(requestId, admin, message);
        return ResponseEntity.ok(ClubJoinRequestResponse.from(rejected));
    }

    private User requireSuperAdmin(Authentication auth) {
        if (auth == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication required");
        }

        User admin = userService.findByUsername(auth.getName());
        if (admin == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found");
        }

        if (admin.getRole() != User.Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied. Admin role required.");
        }

        return admin;
    }

    private void guardAgainstSelfModification(User actingAdmin, Long targetUserId) {
        if (actingAdmin.getId() != null && actingAdmin.getId().equals(targetUserId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot modify your own role.");
        }
    }
}