package com.college.event_hub.service;

import com.college.event_hub.dto.ChatMessageResponse;
import com.college.event_hub.dto.ChatThreadResponse;
import com.college.event_hub.model.ChatMessage;
import com.college.event_hub.model.ChatThread;
import com.college.event_hub.model.ChatThread.Scope;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.Event;
import com.college.event_hub.model.User;
import com.college.event_hub.repository.ChatMessageRepository;
import com.college.event_hub.repository.ChatThreadRepository;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChatService {

    private final ChatThreadRepository threadRepository;
    private final ChatMessageRepository messageRepository;
    private final ClubService clubService;
    private final ClubMembershipService membershipService;
    private final EventService eventService;
    private final RegistrationService registrationService;

    public ChatService(
        ChatThreadRepository threadRepository,
        ChatMessageRepository messageRepository,
        ClubService clubService,
        ClubMembershipService membershipService,
        EventService eventService,
        RegistrationService registrationService
    ) {
        this.threadRepository = threadRepository;
        this.messageRepository = messageRepository;
        this.clubService = clubService;
        this.membershipService = membershipService;
        this.eventService = eventService;
        this.registrationService = registrationService;
    }

    public ChatThreadResponse loadClubThread(Long clubId, User user, Long afterMessageId) {
        guardParticipant(user);
        Club club = requireClub(clubId);
        boolean canParticipate = canParticipateInClubChat(club, user);
        if (!canParticipate) {
            throw new IllegalStateException("You do not have access to this club chat");
        }
        ChatThread thread = getOrCreateClubThread(club);
        List<ChatMessage> messages = fetchMessages(thread, afterMessageId);
    return ChatThreadResponse.of(thread, canParticipate, mapMessages(messages));
    }

    public ChatMessageResponse postClubMessage(Long clubId, User user, String content) {
        guardParticipant(user);
        Club club = requireClub(clubId);
        boolean canParticipate = canParticipateInClubChat(club, user);
        if (!canParticipate) {
            throw new IllegalStateException("You do not have permission to post in this club chat");
        }
        ChatThread thread = getOrCreateClubThread(club);
        ChatMessage saved = persistMessage(thread, user, content);
        return ChatMessageResponse.from(saved);
    }

    public ChatThreadResponse loadEventThread(Long eventId, User user, Long afterMessageId) {
        guardParticipant(user);
        Event event = requireEvent(eventId);
        boolean canParticipate = canParticipateInEventChat(event, user);
        if (!canParticipate) {
            throw new IllegalStateException("You do not have access to this event chat");
        }
        ChatThread thread = getOrCreateEventThread(event);
        List<ChatMessage> messages = fetchMessages(thread, afterMessageId);
    return ChatThreadResponse.of(thread, canParticipate, mapMessages(messages));
    }

    public ChatMessageResponse postEventMessage(Long eventId, User user, String content) {
        guardParticipant(user);
        Event event = requireEvent(eventId);
        boolean canParticipate = canParticipateInEventChat(event, user);
        if (!canParticipate) {
            throw new IllegalStateException("You do not have permission to post in this event chat");
        }
        ChatThread thread = getOrCreateEventThread(event);
        ChatMessage saved = persistMessage(thread, user, content);
        return ChatMessageResponse.from(saved);
    }

    private ChatMessage persistMessage(ChatThread thread, User author, String content) {
        String sanitized = content == null ? "" : content.trim();
        if (sanitized.isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be blank");
        }
        ChatMessage message = new ChatMessage(thread, author, sanitized);
        message.setCreatedAt(LocalDateTime.now());
        ChatMessage saved = messageRepository.save(message);
        thread.setUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);
        return saved;
    }

    private List<ChatMessage> fetchMessages(ChatThread thread, Long afterMessageId) {
        if (thread.getId() == null) {
            return Collections.emptyList();
        }
        if (afterMessageId != null) {
            return messageRepository.findByThreadIdAndIdGreaterThanOrderByIdAsc(thread.getId(), afterMessageId);
        }
        List<ChatMessage> recent = messageRepository.findTop50ByThreadIdOrderByIdDesc(thread.getId());
        Collections.reverse(recent);
        return recent;
    }

    private List<ChatMessageResponse> mapMessages(List<ChatMessage> messages) {
        return messages.stream()
            .map(ChatMessageResponse::from)
            .collect(Collectors.toList());
    }

    private ChatThread getOrCreateClubThread(Club club) {
        return threadRepository.findByScopeAndClubId(Scope.CLUB, club.getId())
            .orElseGet(() -> {
                ChatThread thread = new ChatThread();
                thread.setScope(Scope.CLUB);
                thread.setClub(club);
                thread.setUpdatedAt(LocalDateTime.now());
                return threadRepository.save(thread);
            });
    }

    private ChatThread getOrCreateEventThread(Event event) {
        return threadRepository.findByScopeAndEventId(Scope.EVENT, event.getId())
            .orElseGet(() -> {
                ChatThread thread = new ChatThread();
                thread.setScope(Scope.EVENT);
                thread.setEvent(event);
                thread.setUpdatedAt(LocalDateTime.now());
                return threadRepository.save(thread);
            });
    }

    private Club requireClub(Long clubId) {
        Club club = clubService.findById(clubId);
        if (club == null) {
            throw new IllegalArgumentException("Club not found");
        }
        return club;
    }

    private Event requireEvent(Long eventId) {
        Event event = eventService.findById(eventId);
        if (event == null) {
            throw new IllegalArgumentException("Event not found");
        }
        return event;
    }

    private void guardParticipant(User user) {
        if (user == null) {
            throw new IllegalArgumentException("User is required");
        }
        if (user.getRole() == User.Role.ADMIN) {
            throw new IllegalStateException("Campus administrators do not participate in chat");
        }
    }

    private boolean canParticipateInClubChat(Club club, User user) {
        if (club.getAdmin() != null && Objects.equals(club.getAdmin().getId(), user.getId())) {
            return true;
        }
        return membershipService.isMember(club.getId(), user.getId());
    }

    private boolean canParticipateInEventChat(Event event, User user) {
        Club club = event.getClub();
        if (club != null && club.getAdmin() != null && Objects.equals(club.getAdmin().getId(), user.getId())) {
            return true;
        }
        return registrationService.existsByUserIdAndEventId(user.getId(), event.getId());
    }
}
