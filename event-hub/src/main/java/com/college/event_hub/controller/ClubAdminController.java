package com.college.event_hub.controller;

import com.college.event_hub.dto.ClubAdminDashboardResponse;
import com.college.event_hub.dto.ClubInviteCreateRequest;
import com.college.event_hub.dto.ClubInviteResponse;
import com.college.event_hub.dto.ClubJoinRequestResponse;
import com.college.event_hub.dto.ClubMembershipResponse;
import com.college.event_hub.dto.ClubRequest;
import com.college.event_hub.dto.EventCapacityUpdateRequest;
import com.college.event_hub.dto.EventRequest;
import com.college.event_hub.dto.EventUpdateRequest;
import com.college.event_hub.dto.InstructionRequest;
import com.college.event_hub.dto.JoinRequestDecisionRequest;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.ClubInvite;
import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.Status;
import com.college.event_hub.model.ClubMembership;
import com.college.event_hub.model.Event;
import com.college.event_hub.model.Instruction;
import com.college.event_hub.model.Registration;
import com.college.event_hub.model.User;
import com.college.event_hub.service.ClubService;
import com.college.event_hub.service.ClubInviteService;
import com.college.event_hub.service.ClubJoinRequestService;
import com.college.event_hub.service.ClubMembershipService;
import com.college.event_hub.service.EventService;
import com.college.event_hub.service.InstructionService;
import com.college.event_hub.service.RegistrationService;
import com.college.event_hub.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/club-admin")
public class ClubAdminController {

    private static final String INACTIVE_CLUB_MESSAGE = "Your club is not active yet. Contact the campus admin to manage events, instructions, and invitations.";
    
    @Autowired
    private ClubService clubService;
    
    @Autowired
    private EventService eventService;
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private RegistrationService registrationService;
    
    @Autowired
    private InstructionService instructionService;

    @Autowired
    private ClubMembershipService membershipService;

    @Autowired
    private ClubJoinRequestService joinRequestService;

    @Autowired
    private ClubInviteService inviteService;
    
    // Create a new club (one per admin)
    @PostMapping("/club")
    public ResponseEntity<?> createClub(@Valid @RequestBody ClubRequest request, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            // Check if admin already has a club
            if (clubService.hasClub(admin.getId())) {
                return ResponseEntity.badRequest().body("You already have a club. Each club admin can only create one club.");
            }
            
            Club club = new Club();
            club.setName(request.getName());
            club.setDescription(request.getDescription());
            club.setAdmin(admin);
            club.setStatus(Club.Status.PENDING);

            Club savedClub = clubService.createClub(club);
            return ResponseEntity.ok(savedClub);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating club: " + e.getMessage());
        }
    }

    @GetMapping("/club/members")
    public ResponseEntity<?> listMembers(Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireAdminClub(admin);

            List<ClubMembershipResponse> members = membershipService.findByClub(club.getId()).stream()
                .map(ClubMembershipResponse::from)
                .collect(Collectors.toList());

            return ResponseEntity.ok(members);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @DeleteMapping("/club/members/{membershipId}")
    public ResponseEntity<?> removeMember(@PathVariable Long membershipId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireAdminClub(admin);

            ClubMembership membership = membershipService.findById(membershipId)
                .orElse(null);
            if (membership == null) {
                return ResponseEntity.status(404).body("Membership not found");
            }
            if (!membership.getClub().getId().equals(club.getId())) {
                return ResponseEntity.status(403).body("Membership does not belong to your club");
            }

            membershipService.remove(membershipId);
            return ResponseEntity.ok(Map.of(
                "message", "Member removed",
                "membershipId", membershipId
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @GetMapping("/club/join-requests")
    public ResponseEntity<?> listJoinRequests(
        @RequestParam(value = "status", required = false) String status,
        Authentication auth
    ) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireAdminClub(admin);

            List<ClubJoinRequest> requests;
            if (status != null) {
                try {
                    Status statusEnum = Status.valueOf(status.toUpperCase());
                    requests = joinRequestService.findByClubAndStatus(club.getId(), statusEnum);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body("Invalid status value");
                }
            } else {
                requests = joinRequestService.findByClub(club.getId());
            }

            List<ClubJoinRequestResponse> payload = requests.stream()
                .map(ClubJoinRequestResponse::from)
                .collect(Collectors.toList());

            return ResponseEntity.ok(payload);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @PostMapping("/club/join-requests/{requestId}/approve")
    public ResponseEntity<?> approveJoinRequest(@PathVariable Long requestId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireAdminClub(admin);

            ClubJoinRequest request = joinRequestService.findById(requestId)
                .orElse(null);
            if (request == null || request.getTargetClub() == null) {
                return ResponseEntity.status(404).body("Join request not found");
            }
            if (!request.getTargetClub().getId().equals(club.getId())) {
                return ResponseEntity.status(403).body("Join request does not belong to your club");
            }

            ClubJoinRequest approved = joinRequestService.approveRequest(requestId, admin);
            return ResponseEntity.ok(ClubJoinRequestResponse.from(approved));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/club/join-requests/{requestId}/reject")
    public ResponseEntity<?> rejectJoinRequest(
        @PathVariable Long requestId,
        @Valid @RequestBody(required = false) JoinRequestDecisionRequest decisionRequest,
        Authentication auth
    ) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireAdminClub(admin);

            ClubJoinRequest request = joinRequestService.findById(requestId)
                .orElse(null);
            if (request == null || request.getTargetClub() == null) {
                return ResponseEntity.status(404).body("Join request not found");
            }
            if (!request.getTargetClub().getId().equals(club.getId())) {
                return ResponseEntity.status(403).body("Join request does not belong to your club");
            }

            String message = decisionRequest != null ? decisionRequest.getMessage() : null;
            ClubJoinRequest rejected = joinRequestService.rejectRequest(requestId, admin, message);
            return ResponseEntity.ok(ClubJoinRequestResponse.from(rejected));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @PostMapping("/club/invites")
    public ResponseEntity<?> createInvite(
        @Valid @RequestBody ClubInviteCreateRequest request,
        Authentication auth
    ) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireActiveAdminClub(admin);

            ClubInvite invite = new ClubInvite();
            invite.setClub(club);
            invite.setInviter(admin);
            invite.setInviteeEmail(request.getInviteeEmail());
            invite.setInviteCode(request.getInviteCode());
            invite.setExpiresAt(request.getExpiresAt());

            ClubInvite saved = inviteService.createInvite(invite);
            return ResponseEntity.status(HttpStatus.CREATED).body(ClubInviteResponse.from(saved));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }

    @GetMapping("/club/invites")
    public ResponseEntity<?> listInvites(Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireAdminClub(admin);

            List<ClubInviteResponse> invites = inviteService.findByClub(club.getId()).stream()
                .map(ClubInviteResponse::from)
                .collect(Collectors.toList());

            return ResponseEntity.ok(invites);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

    @DeleteMapping("/club/invites/{inviteId}")
    public ResponseEntity<?> expireInvite(@PathVariable Long inviteId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = requireActiveAdminClub(admin);

            ClubInvite invite = inviteService.findById(inviteId)
                .orElse(null);
            if (invite == null) {
                return ResponseEntity.status(404).body("Invite not found");
            }
            if (!invite.getClub().getId().equals(club.getId())) {
                return ResponseEntity.status(403).body("Invite does not belong to your club");
            }

            ClubInvite expired = inviteService.expireInvite(inviteId);
            return ResponseEntity.ok(ClubInviteResponse.from(expired));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(e.getMessage());
        }
    }
    
    // Get admin's club
    @GetMapping("/club")
    public ResponseEntity<?> getMyClub(Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Club club = clubService.findByAdminId(admin.getId());
            if (club == null) {
                return ResponseEntity.ok().body("You don't have a club yet. Create one first.");
            }
            
            return ResponseEntity.ok(club);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching club: " + e.getMessage());
        }
    }
    
    // Create event in admin's club
    @PostMapping("/events")
    public ResponseEntity<Event> createEvent(@Valid @RequestBody EventRequest request, Authentication auth) {
        User admin = requireClubAdmin(auth);
        Club club = requireActiveAdminClub(admin);

        Event event = new Event();
        event.setTitle(request.getTitle());
        event.setDescription(request.getDescription());
        event.setEventDate(parseEventDate(request.getEventDate()));
        event.setLocation(request.getLocation());
        event.setCapacity(request.getCapacity());
        event.setClub(club);

        Event savedEvent = eventService.createEvent(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
    }
    
    // Get all events in admin's club
    @GetMapping("/events")
    public ResponseEntity<?> getMyEvents(Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            List<Event> events = eventService.findByAdminId(admin.getId());
            return ResponseEntity.ok(events);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching events: " + e.getMessage());
        }
    }
    
    // Update event capacity
    @PutMapping("/events/{eventId}/capacity")
    public ResponseEntity<Event> updateEventCapacity(@PathVariable Long eventId, @Valid @RequestBody EventCapacityUpdateRequest request, Authentication auth) {
        User admin = requireClubAdmin(auth);
        Event event = requireEditableEventOwnedByAdmin(eventId, admin);

        Integer newCapacity = request.getCapacity();
        int currentRegistrations = event.getCurrentRegistrations() == null ? 0 : event.getCurrentRegistrations();
        if (newCapacity < currentRegistrations) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reduce capacity below current registrations (" + currentRegistrations + ")");
        }

        event.setCapacity(newCapacity);
        Event updatedEvent = eventService.updateEvent(event);
        return ResponseEntity.ok(updatedEvent);
    }

    @PutMapping("/events/{eventId}")
    public ResponseEntity<Event> updateEvent(@PathVariable Long eventId, @Valid @RequestBody EventUpdateRequest request, Authentication auth) {
        User admin = requireClubAdmin(auth);
        Event event = requireEditableEventOwnedByAdmin(eventId, admin);

        if (request.getTitle() != null) {
            event.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            event.setDescription(request.getDescription());
        }
        if (request.getEventDate() != null) {
            event.setEventDate(parseEventDate(request.getEventDate()));
        }
        if (request.getLocation() != null) {
            event.setLocation(request.getLocation());
        }
        if (request.getCapacity() != null) {
            int newCapacity = request.getCapacity();
            int currentRegistrations = event.getCurrentRegistrations() == null ? 0 : event.getCurrentRegistrations();
            if (newCapacity < currentRegistrations) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot reduce capacity below current registrations (" + currentRegistrations + ")");
            }
            event.setCapacity(newCapacity);
        }

        Event updatedEvent = eventService.updateEvent(event);
        return ResponseEntity.ok(updatedEvent);
    }

    @DeleteMapping("/events/{eventId}")
    public ResponseEntity<?> deleteEvent(@PathVariable Long eventId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            requireEditableEventOwnedByAdmin(eventId, admin);

            eventService.deleteEvent(eventId);
            return ResponseEntity.ok(Map.of(
                "message", "Event deleted",
                "eventId", eventId
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting event: " + e.getMessage());
        }
    }
    
    // Get event statistics
    @GetMapping("/events/{eventId}/stats")
    public ResponseEntity<?> getEventStats(@PathVariable Long eventId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Event event = requireEventOwnedByAdmin(eventId, admin);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("eventId", eventId);
            stats.put("title", event.getTitle());
            stats.put("capacity", event.getCapacity());
            stats.put("currentRegistrations", event.getCurrentRegistrations());
            Integer capacity = event.getCapacity();
            Integer current = event.getCurrentRegistrations();
            stats.put("availableSpots", (capacity != null && current != null) ? (capacity - current) : null);
            stats.put("registrationPercentage", (capacity != null && capacity > 0 && current != null)
                ? (current * 100.0) / capacity
                : null);
            
            List<Registration> registrations = registrationService.findByEventId(eventId);
            stats.put("registrations", registrations);
            
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching event stats: " + e.getMessage());
        }
    }

    @GetMapping("/events/{eventId}/registrations")
    public ResponseEntity<?> listRegistrations(@PathVariable Long eventId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Event event = requireEventOwnedByAdmin(eventId, admin);

            List<Map<String, Object>> registrations = registrationService.findByEventId(event.getId()).stream()
                .map(reg -> Map.<String, Object>of(
                    "registrationId", reg.getId(),
                    "status", reg.getStatus(),
                    "registeredAt", reg.getRegisteredAt(),
                    "attendee", Map.of(
                        "id", reg.getUser().getId(),
                        "username", reg.getUser().getUsername(),
                        "fullName", reg.getUser().getFullName(),
                        "email", reg.getUser().getEmail(),
                        "phoneNumber", reg.getUser().getPhoneNumber(),
                        "classDetails", reg.getUser().getClassDetails()
                    )
                ))
                .collect(Collectors.toList());

            return ResponseEntity.ok(registrations);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching registrations: " + e.getMessage());
        }
    }
    
    // Create instruction for event
    @PostMapping("/events/{eventId}/instructions")
    public ResponseEntity<?> createInstruction(@PathVariable Long eventId, @Valid @RequestBody InstructionRequest request, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Event event = requireEditableEventOwnedByAdmin(eventId, admin);

            Instruction instruction = new Instruction();
            instruction.setTitle(request.getTitle());
            instruction.setContent(request.getContent());
            instruction.setEvent(event);
            instruction.setCreator(admin);
            instruction.setIsImportant(Boolean.TRUE.equals(request.getIsImportant()));

            Instruction savedInstruction = instructionService.createInstruction(instruction);
            return ResponseEntity.ok(savedInstruction);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating instruction: " + e.getMessage());
        }
    }

    @GetMapping("/events/{eventId}/instructions")
    public ResponseEntity<?> listInstructions(@PathVariable Long eventId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            requireEventOwnedByAdmin(eventId, admin);

            List<Instruction> instructions = instructionService.findByEventId(eventId);
            return ResponseEntity.ok(instructions);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching instructions: " + e.getMessage());
        }
    }

    @PutMapping("/events/{eventId}/instructions/{instructionId}")
    public ResponseEntity<?> updateInstruction(@PathVariable Long eventId, @PathVariable Long instructionId, @Valid @RequestBody InstructionRequest request, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Event event = requireEditableEventOwnedByAdmin(eventId, admin);
            Instruction instruction = requireEditableInstructionOwnedByAdmin(instructionId, admin);

            if (!instruction.getEvent().getId().equals(event.getId())) {
                return ResponseEntity.status(403).body("Instruction does not belong to the specified event.");
            }

            if (request.getTitle() != null) {
                instruction.setTitle(request.getTitle());
            }
            if (request.getContent() != null) {
                instruction.setContent(request.getContent());
            }
            if (request.getIsImportant() != null) {
                instruction.setIsImportant(request.getIsImportant());
            }

            Instruction updated = instructionService.updateInstruction(instruction);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating instruction: " + e.getMessage());
        }
    }

    @DeleteMapping("/events/{eventId}/instructions/{instructionId}")
    public ResponseEntity<?> deleteInstruction(@PathVariable Long eventId, @PathVariable Long instructionId, Authentication auth) {
        try {
            User admin = requireClubAdmin(auth);
            Event event = requireEditableEventOwnedByAdmin(eventId, admin);
            Instruction instruction = requireEditableInstructionOwnedByAdmin(instructionId, admin);

            if (!instruction.getEvent().getId().equals(event.getId())) {
                return ResponseEntity.status(403).body("Instruction does not belong to the specified event.");
            }

            instructionService.deleteInstruction(instructionId);
            return ResponseEntity.ok(Map.of(
                "message", "Instruction deleted",
                "instructionId", instructionId
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(403).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error deleting instruction: " + e.getMessage());
        }
    }
    
    // Get dashboard overview
    @GetMapping("/dashboard")
    public ResponseEntity<ClubAdminDashboardResponse> getDashboard(Authentication auth) {
        User admin = requireClubAdmin(auth);
        Club club = clubService.findByAdminId(admin.getId());

        if (club == null) {
            return ResponseEntity.ok(ClubAdminDashboardResponse.noClub("Create your club to get started!"));
        }

        LocalDateTime now = LocalDateTime.now();
        List<Event> allEvents = eventService.findByAdminId(admin.getId());
        List<Long> eventIds = allEvents.stream()
            .map(Event::getId)
            .collect(Collectors.toList());

        ClubAdminDashboardResponse.Metrics metrics = new ClubAdminDashboardResponse.Metrics();
        metrics.setTotalEvents(allEvents.size());
        metrics.setUpcomingEvents(eventService.countUpcomingEventsForAdmin(admin.getId(), now));
        metrics.setTotalRegistrations(registrationService.countByEventIds(eventIds));
        metrics.setInstructionCount(instructionService.countByEventIds(eventIds));

        List<Event> upcomingEvents = eventService.findUpcomingEventsForAdmin(admin.getId(), now, 5);
        List<Registration> recentRegistrations = registrationService.findRecentRegistrationsForEvents(eventIds, 5);

        ClubAdminDashboardResponse response = ClubAdminDashboardResponse.from(
            club,
            metrics,
            upcomingEvents,
            recentRegistrations
        );

        return ResponseEntity.ok(response);
    }

    private User requireClubAdmin(Authentication auth) {
        if (auth == null) {
            throw new IllegalStateException("Authentication required");
        }

        User user = userService.findByUsername(auth.getName());
        if (user == null || user.getRole() != User.Role.CLUB_ADMIN) {
            throw new IllegalStateException("Access denied. Club admin role required.");
        }
        return user;
    }

    private Club requireAdminClub(User admin) {
        Club club = clubService.findByAdminId(admin.getId());
        if (club == null) {
            throw new IllegalStateException("You must create a club first before performing this action.");
        }
        return club;
    }

    private Club requireActiveAdminClub(User admin) {
        Club club = requireAdminClub(admin);
        ensureClubIsActive(club);
        return club;
    }

    private void ensureClubIsActive(Club club) {
        if (club == null) {
            throw new IllegalStateException("Club not found");
        }
        if (club.getStatus() != Club.Status.ACTIVE) {
            throw new IllegalStateException(INACTIVE_CLUB_MESSAGE);
        }
    }

    private Event requireEventOwnedByAdmin(Long eventId, User admin) {
        Event event = eventService.findById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found");
        }
        if (!event.getClub().getAdmin().getId().equals(admin.getId())) {
            throw new IllegalStateException("You can only manage events in your club.");
        }
        return event;
    }

    private Event requireEditableEventOwnedByAdmin(Long eventId, User admin) {
        Event event = requireEventOwnedByAdmin(eventId, admin);
        ensureClubIsActive(event.getClub());
        return event;
    }

    private Instruction requireInstructionOwnedByAdmin(Long instructionId, User admin) {
        Instruction instruction = instructionService.findById(instructionId);
        if (instruction == null) {
            throw new IllegalArgumentException("Instruction not found");
        }
        if (instruction.getEvent() == null || instruction.getEvent().getClub() == null
            || !instruction.getEvent().getClub().getAdmin().getId().equals(admin.getId())) {
            throw new IllegalStateException("You can only manage instructions for your events.");
        }
        return instruction;
    }

    private Instruction requireEditableInstructionOwnedByAdmin(Long instructionId, User admin) {
        Instruction instruction = requireInstructionOwnedByAdmin(instructionId, admin);
        ensureClubIsActive(instruction.getEvent().getClub());
        return instruction;
    }

    private LocalDateTime parseEventDate(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            return LocalDateTime.parse(raw.trim(), DateTimeFormatter.ISO_DATE_TIME);
        } catch (RuntimeException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Event date must be ISO-8601 (e.g., 2025-10-20T10:00:00)");
        }
    }
}