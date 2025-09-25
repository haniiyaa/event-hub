package com.college.event_hub.controller;

import com.college.event_hub.model.*;
import com.college.event_hub.service.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/club-admin")
public class ClubAdminController {
    
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
    
    // Create a new club (one per admin)
    @PostMapping("/club")
    public ResponseEntity<?> createClub(@RequestBody Club club, Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            if (admin == null || admin.getRole() != User.Role.CLUB_ADMIN) {
                return ResponseEntity.status(403).body("Access denied. Only club admins can create clubs.");
            }
            
            // Check if admin already has a club
            if (clubService.hasClub(admin.getId())) {
                return ResponseEntity.badRequest().body("You already have a club. Each club admin can only create one club.");
            }
            
            club.setAdmin(admin);
            Club savedClub = clubService.createClub(club);
            return ResponseEntity.ok(savedClub);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating club: " + e.getMessage());
        }
    }
    
    // Get admin's club
    @GetMapping("/club")
    public ResponseEntity<?> getMyClub(Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            if (admin == null || admin.getRole() != User.Role.CLUB_ADMIN) {
                return ResponseEntity.status(403).body("Access denied.");
            }
            
            Club club = clubService.findByAdminId(admin.getId());
            if (club == null) {
                return ResponseEntity.ok().body("You don't have a club yet. Create one first.");
            }
            
            return ResponseEntity.ok(club);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching club: " + e.getMessage());
        }
    }
    
    // Create event in admin's club
    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestBody Map<String, Object> eventData, Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            if (admin == null || admin.getRole() != User.Role.CLUB_ADMIN) {
                return ResponseEntity.status(403).body("Access denied.");
            }
            
            Club club = clubService.findByAdminId(admin.getId());
            if (club == null) {
                return ResponseEntity.badRequest().body("You must create a club first before creating events.");
            }
            
            Event event = new Event();
            event.setTitle((String) eventData.get("title"));
            event.setDescription((String) eventData.get("description"));
            event.setEventDate(LocalDateTime.parse((String) eventData.get("eventDate")));
            event.setLocation((String) eventData.get("location"));
            event.setCapacity((Integer) eventData.get("capacity"));
            event.setClub(club);
            
            Event savedEvent = eventService.createEvent(event);
            return ResponseEntity.ok(savedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating event: " + e.getMessage());
        }
    }
    
    // Get all events in admin's club
    @GetMapping("/events")
    public ResponseEntity<?> getMyEvents(Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            if (admin == null || admin.getRole() != User.Role.CLUB_ADMIN) {
                return ResponseEntity.status(403).body("Access denied.");
            }
            
            List<Event> events = eventService.findByAdminId(admin.getId());
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching events: " + e.getMessage());
        }
    }
    
    // Update event capacity
    @PutMapping("/events/{eventId}/capacity")
    public ResponseEntity<?> updateEventCapacity(@PathVariable Long eventId, @RequestBody Map<String, Integer> request, Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            Event event = eventService.findById(eventId);
            if (event == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if the event belongs to admin's club
            if (!event.getClub().getAdmin().getId().equals(admin.getId())) {
                return ResponseEntity.status(403).body("You can only modify events in your own club.");
            }
            
            Integer newCapacity = request.get("capacity");
            if (newCapacity < event.getCurrentRegistrations()) {
                return ResponseEntity.badRequest().body("Cannot reduce capacity below current registrations (" + event.getCurrentRegistrations() + ")");
            }
            
            event.setCapacity(newCapacity);
            Event updatedEvent = eventService.updateEvent(event);
            return ResponseEntity.ok(updatedEvent);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating capacity: " + e.getMessage());
        }
    }
    
    // Get event statistics
    @GetMapping("/events/{eventId}/stats")
    public ResponseEntity<?> getEventStats(@PathVariable Long eventId, Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            Event event = eventService.findById(eventId);
            if (event == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if the event belongs to admin's club
            if (!event.getClub().getAdmin().getId().equals(admin.getId())) {
                return ResponseEntity.status(403).body("Access denied.");
            }
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("eventId", eventId);
            stats.put("title", event.getTitle());
            stats.put("capacity", event.getCapacity());
            stats.put("currentRegistrations", event.getCurrentRegistrations());
            stats.put("availableSpots", event.getCapacity() - event.getCurrentRegistrations());
            stats.put("registrationPercentage", (event.getCurrentRegistrations() * 100.0) / event.getCapacity());
            
            List<Registration> registrations = registrationService.findByEventId(eventId);
            stats.put("registrations", registrations);
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching event stats: " + e.getMessage());
        }
    }
    
    // Create instruction for event
    @PostMapping("/events/{eventId}/instructions")
    public ResponseEntity<?> createInstruction(@PathVariable Long eventId, @RequestBody Map<String, Object> instructionData, Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            Event event = eventService.findById(eventId);
            if (event == null) {
                return ResponseEntity.notFound().build();
            }
            
            // Check if the event belongs to admin's club
            if (!event.getClub().getAdmin().getId().equals(admin.getId())) {
                return ResponseEntity.status(403).body("You can only add instructions to events in your own club.");
            }
            
            Instruction instruction = new Instruction();
            instruction.setTitle((String) instructionData.get("title"));
            instruction.setContent((String) instructionData.get("content"));
            instruction.setEvent(event);
            instruction.setCreator(admin);
            instruction.setIsImportant((Boolean) instructionData.getOrDefault("isImportant", false));
            
            Instruction savedInstruction = instructionService.createInstruction(instruction);
            return ResponseEntity.ok(savedInstruction);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error creating instruction: " + e.getMessage());
        }
    }
    
    // Get dashboard overview
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard(Authentication auth) {
        try {
            String username = auth.getName();
            User admin = userService.findByUsername(username);
            
            if (admin == null || admin.getRole() != User.Role.CLUB_ADMIN) {
                return ResponseEntity.status(403).body("Access denied.");
            }
            
            Map<String, Object> dashboard = new HashMap<>();
            
            Club club = clubService.findByAdminId(admin.getId());
            if (club == null) {
                dashboard.put("hasClub", false);
                dashboard.put("message", "Create your club to get started!");
                return ResponseEntity.ok(dashboard);
            }
            
            dashboard.put("hasClub", true);
            dashboard.put("club", club);
            
            List<Event> events = eventService.findByAdminId(admin.getId());
            dashboard.put("events", events);
            dashboard.put("totalEvents", events.size());
            
            int totalRegistrations = events.stream()
                .mapToInt(Event::getCurrentRegistrations)
                .sum();
            dashboard.put("totalRegistrations", totalRegistrations);
            
            return ResponseEntity.ok(dashboard);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching dashboard: " + e.getMessage());
        }
    }
}