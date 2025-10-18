package com.college.event_hub.controller;

import com.college.event_hub.dto.ChatMessageRequest;
import com.college.event_hub.dto.ChatMessageResponse;
import com.college.event_hub.dto.ChatThreadResponse;
import com.college.event_hub.model.User;
import com.college.event_hub.service.ChatService;
import com.college.event_hub.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final UserService userService;

    public ChatController(ChatService chatService, UserService userService) {
        this.chatService = chatService;
        this.userService = userService;
    }

    @GetMapping("/clubs/{clubId}/messages")
    public ResponseEntity<?> getClubMessages(
        @PathVariable Long clubId,
        @RequestParam(value = "after", required = false) Long afterMessageId,
        Authentication authentication
    ) {
        try {
            User user = resolveUser(authentication);
            ChatThreadResponse payload = chatService.loadClubThread(clubId, user, afterMessageId);
            return ResponseEntity.ok(payload);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/clubs/{clubId}/messages")
    public ResponseEntity<?> postClubMessage(
        @PathVariable Long clubId,
        @Valid @RequestBody ChatMessageRequest request,
        Authentication authentication
    ) {
        try {
            User user = resolveUser(authentication);
            ChatMessageResponse response = chatService.postClubMessage(clubId, user, request.getContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/events/{eventId}/messages")
    public ResponseEntity<?> getEventMessages(
        @PathVariable Long eventId,
        @RequestParam(value = "after", required = false) Long afterMessageId,
        Authentication authentication
    ) {
        try {
            User user = resolveUser(authentication);
            ChatThreadResponse payload = chatService.loadEventThread(eventId, user, afterMessageId);
            return ResponseEntity.ok(payload);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/events/{eventId}/messages")
    public ResponseEntity<?> postEventMessage(
        @PathVariable Long eventId,
        @Valid @RequestBody ChatMessageRequest request,
        Authentication authentication
    ) {
        try {
            User user = resolveUser(authentication);
            ChatMessageResponse response = chatService.postEventMessage(eventId, user, request.getContent());
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
        }
    }

    private User resolveUser(Authentication authentication) {
        if (authentication == null) {
            throw new IllegalArgumentException("Authentication required");
        }
        User user = userService.findByUsername(authentication.getName());
        if (user == null) {
            throw new IllegalArgumentException("User not found");
        }
        return user;
    }
}
