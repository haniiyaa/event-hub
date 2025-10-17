package com.college.event_hub.controller;

import com.college.event_hub.dto.ClubCreationRequest;
import com.college.event_hub.dto.ClubInviteResponse;
import com.college.event_hub.dto.ClubJoinRequestCreateRequest;
import com.college.event_hub.dto.ClubJoinRequestResponse;
import com.college.event_hub.dto.StudentDashboardResponse;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.Event;
import com.college.event_hub.model.Instruction;
import com.college.event_hub.model.Registration;
import com.college.event_hub.model.User;
import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.RequestType;
import com.college.event_hub.model.ClubInvite;
import com.college.event_hub.service.EventService;
import com.college.event_hub.service.InstructionService;
import com.college.event_hub.service.RegistrationService;
import com.college.event_hub.service.UserService;
import com.college.event_hub.service.ClubService;
import com.college.event_hub.service.ClubJoinRequestService;
import com.college.event_hub.service.ClubInviteService;
import jakarta.validation.Valid;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/student")
public class StudentController {

    @Autowired
    private EventService eventService;

    @Autowired
    private RegistrationService registrationService;

    @Autowired
    private UserService userService;

    @Autowired
    private InstructionService instructionService;

    @Autowired
    private ClubService clubService;

    @Autowired
    private ClubJoinRequestService joinRequestService;

    @Autowired
    private ClubInviteService inviteService;

    @GetMapping("/events")
    public ResponseEntity<?> listEvents(
        @RequestParam(value = "clubId", required = false) Long clubId,
        @RequestParam(value = "from", required = false) String from,
        @RequestParam(value = "to", required = false) String to,
        @RequestParam(value = "q", required = false) String keyword
    ) {
        try {
            LocalDateTime fromDate = from != null ? LocalDateTime.parse(from) : null;
            LocalDateTime toDate = to != null ? LocalDateTime.parse(to) : null;

            List<Event> events = eventService.searchEvents(fromDate, toDate, clubId, keyword).stream()
                .filter(this::isEventVisibleToStudents)
                .collect(Collectors.toList());
            return ResponseEntity.ok(events);
        } catch (DateTimeParseException e) {
            return ResponseEntity.badRequest().body("Invalid date format. Use ISO-8601 (e.g., 2025-10-20T10:00:00)");
        }
    }

    @GetMapping("/events/{eventId}")
    public ResponseEntity<?> getEvent(@PathVariable Long eventId) {
        Event event = eventService.findById(eventId);
        if (!isEventVisibleToStudents(event)) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(event);
    }

    @PostMapping("/clubs/{clubId}/join-requests")
    public ResponseEntity<?> requestClubMembership(
        @PathVariable Long clubId,
        @Valid @RequestBody ClubJoinRequestCreateRequest requestBody,
        Authentication auth
    ) {
        try {
            User user = resolveUser(auth);
            Club club = requireClub(clubId);

            ClubJoinRequest request = new ClubJoinRequest();
            request.setRequester(user);
            request.setTargetClub(club);
            request.setType(RequestType.JOIN_CLUB);
            request.setMessage(requestBody.getMessage());

            ClubJoinRequest saved = joinRequestService.createRequest(request);
            return ResponseEntity.ok(ClubJoinRequestResponse.from(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/club-requests")
    public ResponseEntity<?> requestClubCreation(
        @Valid @RequestBody ClubCreationRequest requestBody,
        Authentication auth
    ) {
        try {
            User user = resolveUser(auth);

            ClubJoinRequest request = new ClubJoinRequest();
            request.setRequester(user);
            request.setType(RequestType.CREATE_CLUB);
            request.setRequestedName(requestBody.getName());
            request.setRequestedDescription(requestBody.getDescription());
            request.setMessage(requestBody.getMessage());

            ClubJoinRequest saved = joinRequestService.createRequest(request);
            return ResponseEntity.ok(ClubJoinRequestResponse.from(saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/join-requests")
    public ResponseEntity<?> myJoinRequests(Authentication auth) {
        User user = resolveUser(auth);
        List<ClubJoinRequest> requests = joinRequestService.findByRequester(user.getId());
        List<ClubJoinRequestResponse> payload = requests.stream()
            .map(ClubJoinRequestResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @DeleteMapping("/join-requests/{requestId}")
    public ResponseEntity<?> cancelJoinRequest(@PathVariable Long requestId, Authentication auth) {
        try {
            User user = resolveUser(auth);
            ClubJoinRequest request = joinRequestService.findById(requestId)
                .orElse(null);
            if (request == null) {
                return ResponseEntity.status(404).body("Join request not found");
            }
            if (!request.getRequester().getId().equals(user.getId())) {
                return ResponseEntity.status(403).body("You can only cancel your own join requests");
            }
            ClubJoinRequest cancelled = joinRequestService.cancelRequest(requestId);
            return ResponseEntity.ok(ClubJoinRequestResponse.from(cancelled));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/invites")
    public ResponseEntity<?> myInvites(Authentication auth) {
        User user = resolveUser(auth);
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            return ResponseEntity.ok(List.of());
        }
        List<ClubInvite> invites = inviteService.findPendingInvitesForEmail(user.getEmail());
        List<ClubInviteResponse> payload = invites.stream()
            .map(ClubInviteResponse::from)
            .collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @PostMapping("/invites/{inviteCode}/accept")
    public ResponseEntity<?> acceptInvite(@PathVariable String inviteCode, Authentication auth) {
        try {
            User user = resolveUser(auth);
            ClubInvite invite = inviteService.acceptInvite(inviteCode, user);
            return ResponseEntity.ok(ClubInviteResponse.from(invite));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/invites/{inviteCode}/decline")
    public ResponseEntity<?> declineInvite(@PathVariable String inviteCode, Authentication auth) {
        try {
            User user = resolveUser(auth);
            ClubInvite invite = inviteService.declineInvite(inviteCode, user);
            return ResponseEntity.ok(ClubInviteResponse.from(invite));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/events/{eventId}/register")
    public ResponseEntity<?> registerForEvent(@PathVariable Long eventId, Authentication auth) {
        try {
            User user = resolveUser(auth);
            Event event = requireEvent(eventId);
            guardEventIsActive(event);

            Registration registration = registrationService.registerUserForEvent(user, event);
            return ResponseEntity.ok(Map.of(
                "message", "Registration successful",
                "registrationId", registration.getId(),
                "eventId", event.getId(),
                "status", registration.getStatus()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @DeleteMapping("/events/{eventId}/register")
    public ResponseEntity<?> cancelRegistration(@PathVariable Long eventId, Authentication auth) {
        try {
            User user = resolveUser(auth);
            Event event = requireEvent(eventId);

            registrationService.cancelRegistrationForUser(user.getId(), event.getId());
            return ResponseEntity.ok(Map.of(
                "message", "Registration cancelled",
                "eventId", event.getId()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        }
    }

    @GetMapping("/events/{eventId}/instructions")
    public ResponseEntity<?> getInstructions(@PathVariable Long eventId) {
        Event event = eventService.findById(eventId);
        if (!isEventVisibleToStudents(event)) {
            return ResponseEntity.notFound().build();
        }

        List<Instruction> instructions = instructionService.findByEventId(eventId);
        return ResponseEntity.ok(instructions);
    }

    @GetMapping("/me/registrations")
    public ResponseEntity<?> myRegistrations(Authentication auth) {
        User user = resolveUser(auth);
        List<Registration> registrations = registrationService.findByUserId(user.getId());

        List<Map<String, Object>> payload = registrations.stream()
            .map(reg -> Map.<String, Object>of(
                "registrationId", reg.getId(),
                "status", reg.getStatus(),
                "registeredAt", reg.getRegisteredAt(),
                "event", Map.of(
                    "id", reg.getEvent().getId(),
                    "title", reg.getEvent().getTitle(),
                    "eventDate", reg.getEvent().getEventDate(),
                    "location", reg.getEvent().getLocation(),
                    "capacity", reg.getEvent().getCapacity(),
                    "currentRegistrations", reg.getEvent().getCurrentRegistrations()
                )
            ))
            .collect(Collectors.toList());

        return ResponseEntity.ok(payload);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<StudentDashboardResponse> getDashboard(Authentication auth) {
        User user = resolveUser(auth);
        LocalDateTime now = LocalDateTime.now();

        long totalRegistrations = registrationService.countByUserId(user.getId());
        long upcomingRegistrationsCount = registrationService.countUpcomingRegistrationsForUser(user.getId(), now);

        List<Registration> upcomingRegistrations = registrationService.findUpcomingRegistrationsForUser(user.getId(), now, 5);
        List<Long> upcomingEventIds = upcomingRegistrations.stream()
            .map(reg -> reg.getEvent() != null ? reg.getEvent().getId() : null)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());

        long pendingInstructions = instructionService.countByEventIds(upcomingEventIds);
        List<Instruction> recentInstructions = instructionService.findRecentInstructionsForEventIds(upcomingEventIds, 5);

        List<Long> registeredEventIds = registrationService.findByUserId(user.getId()).stream()
            .map(reg -> reg.getEvent() != null ? reg.getEvent().getId() : null)
            .filter(Objects::nonNull)
            .distinct()
            .collect(Collectors.toList());

        List<Event> recommendedEvents = eventService.findRecommendedEvents(registeredEventIds, now, 5);

        StudentDashboardResponse.Metrics metrics = new StudentDashboardResponse.Metrics();
        metrics.setTotalRegistrations(totalRegistrations);
        metrics.setUpcomingRegistrations(upcomingRegistrationsCount);
        metrics.setPendingInstructions(pendingInstructions);

        StudentDashboardResponse response = StudentDashboardResponse.from(
            user,
            metrics,
            upcomingRegistrations,
            recommendedEvents,
            recentInstructions
        );

        return ResponseEntity.ok(response);
    }

    private User resolveUser(Authentication auth) {
        if (auth == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        User user = userService.findByUsername(auth.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return user;
    }

    private Event requireEvent(Long eventId) {
        Event event = eventService.findById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found");
        }
        return event;
    }

    private Club requireClub(Long clubId) {
        Club club = clubService.findById(clubId);
        if (club == null) {
            throw new IllegalArgumentException("Club not found");
        }
        return club;
    }

    private boolean isEventVisibleToStudents(Event event) {
        if (event == null) {
            return false;
        }
        Club club = event.getClub();
        return club != null && club.getStatus() == Club.Status.ACTIVE;
    }

    private void guardEventIsActive(Event event) {
        if (!isEventVisibleToStudents(event)) {
            throw new IllegalStateException("Event is not accepting registrations at this time");
        }
    }

}
