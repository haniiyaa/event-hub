package com.college.event_hub.service;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.Event;
import com.college.event_hub.repository.EventRepository;
import com.college.event_hub.repository.RegistrationRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class EventService {
    
    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private RegistrationRepository registrationRepository;
    
    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }
    
    public Event findById(Long id) {
        return eventRepository.findById(id).orElse(null);
    }
    
    public List<Event> findByClubId(Long clubId) {
        return eventRepository.findByClubId(clubId);
    }
    
    public List<Event> findByAdminId(Long adminId) {
        return eventRepository.findByClubAdminId(adminId);
    }
    
    public List<Event> findAll() {
        return eventRepository.findAll();
    }
    
    public Event updateEvent(Event event) {
        return eventRepository.save(event);
    }
    
    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }
    
    public void updateEventRegistrationCount(Long eventId) {
        Event event = findById(eventId);
        if (event != null) {
            int count = registrationRepository.countByEventId(eventId);
            event.setCurrentRegistrations(count);
            updateEvent(event);
        }
    }

    public List<Event> searchEvents(LocalDateTime from, LocalDateTime to, Long clubId, String keyword) {
        String normalizedKeyword = keyword != null ? keyword.toLowerCase(Locale.ROOT) : null;

        return eventRepository.findAll().stream()
            .filter(this::isClubActive)
            .filter(event -> clubId == null || (event.getClub() != null && clubId.equals(event.getClub().getId())))
            .filter(event -> {
                if (from == null || event.getEventDate() == null) {
                    return true;
                }
                return !event.getEventDate().isBefore(from);
            })
            .filter(event -> {
                if (to == null || event.getEventDate() == null) {
                    return true;
                }
                return !event.getEventDate().isAfter(to);
            })
            .filter(event -> {
                if (normalizedKeyword == null) {
                    return true;
                }
                String title = event.getTitle() != null ? event.getTitle().toLowerCase(Locale.ROOT) : "";
                String description = event.getDescription() != null ? event.getDescription().toLowerCase(Locale.ROOT) : "";
                return title.contains(normalizedKeyword) || description.contains(normalizedKeyword);
            })
            .collect(Collectors.toList());
    }

    public List<Event> findUpcomingEvents(LocalDateTime referenceDate, int limit) {
        return eventRepository.findTop10ByEventDateAfterOrderByEventDateAsc(referenceDate).stream()
            .filter(this::isClubActive)
            .filter(event -> !isEventInPast(event, referenceDate))
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<Event> findRecommendedEvents(Collection<Long> excludeIds, LocalDateTime referenceDate, int limit) {
        Set<Long> excluded = excludeIds != null ? excludeIds.stream().collect(Collectors.toSet()) : Set.of();

        Stream<Event> candidates = eventRepository.findTop10ByEventDateAfterOrderByEventDateAsc(referenceDate).stream();
        return candidates
            .filter(this::isClubActive)
            .filter(event -> !excluded.contains(event.getId()))
            .filter(event -> !isEventInPast(event, referenceDate))
            .filter(event -> {
                Integer capacity = event.getCapacity();
                Integer current = event.getCurrentRegistrations();
                return capacity == null || current == null || current < capacity;
            })
            .limit(limit)
            .collect(Collectors.toList());
    }

    public List<Event> findUpcomingEventsForAdmin(Long adminId, LocalDateTime referenceDate, int limit) {
        return eventRepository.findTop5ByClub_Admin_IdAndEventDateAfterOrderByEventDateAsc(adminId, referenceDate).stream()
            .filter(event -> !isEventInPast(event, referenceDate))
            .limit(limit)
            .collect(Collectors.toList());
    }

    public long countEventsForAdmin(Long adminId) {
        return eventRepository.countByClub_Admin_Id(adminId);
    }

    public long countUpcomingEventsForAdmin(Long adminId, LocalDateTime referenceDate) {
        return eventRepository.countByClub_Admin_IdAndEventDateAfter(adminId, referenceDate);
    }

    private boolean isEventInPast(Event event, LocalDateTime referenceDate) {
        if (event.getEventDate() == null) {
            return false;
        }
        return event.getEventDate().isBefore(referenceDate);
    }

    private boolean isClubActive(Event event) {
        if (event == null) {
            return false;
        }
        Club club = event.getClub();
        return club != null && club.getStatus() == Club.Status.ACTIVE;
    }
}