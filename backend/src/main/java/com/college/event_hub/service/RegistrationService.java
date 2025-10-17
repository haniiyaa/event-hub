package com.college.event_hub.service;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.Event;
import com.college.event_hub.model.Registration;
import com.college.event_hub.model.User;
import com.college.event_hub.repository.RegistrationRepository;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RegistrationService {
    
    @Autowired
    private RegistrationRepository registrationRepository;
    
    @Autowired
    private EventService eventService;
    
    public Registration createRegistration(Registration registration) {
        Registration saved = registrationRepository.save(registration);
        // Update event registration count
        eventService.updateEventRegistrationCount(registration.getEvent().getId());
        return saved;
    }

    public Registration registerUserForEvent(User user, Event event) {
        if (user == null || event == null) {
            throw new IllegalArgumentException("User and event must be provided");
        }

        if (event.getClub() == null || event.getClub().getStatus() != Club.Status.ACTIVE) {
            throw new IllegalStateException("Event is not accepting registrations at this time");
        }

        if (existsByUserIdAndEventId(user.getId(), event.getId())) {
            throw new IllegalStateException("User is already registered for this event");
        }

        if (event.getCapacity() != null) {
            int currentCount = event.getCurrentRegistrations() != null
                ? event.getCurrentRegistrations()
                : countByEventId(event.getId());

            if (currentCount >= event.getCapacity()) {
                throw new IllegalStateException("Event is already at full capacity");
            }
        }

        Registration registration = new Registration(user, event);
        registration.setStatus(Registration.Status.REGISTERED);

        return createRegistration(registration);
    }
    
    public Registration findById(Long id) {
        return registrationRepository.findById(id).orElse(null);
    }
    
    public List<Registration> findByEventId(Long eventId) {
        return registrationRepository.findByEventId(eventId);
    }
    
    public List<Registration> findByUserId(Long userId) {
        return registrationRepository.findByUserId(userId);
    }
    
    public Registration findByUserIdAndEventId(Long userId, Long eventId) {
        return registrationRepository.findByUserIdAndEventId(userId, eventId).orElse(null);
    }
    
    public boolean existsByUserIdAndEventId(Long userId, Long eventId) {
        return registrationRepository.existsByUserIdAndEventId(userId, eventId);
    }
    
    public List<Registration> findAll() {
        return registrationRepository.findAll();
    }
    
    public Registration updateRegistration(Registration registration) {
        return registrationRepository.save(registration);
    }
    
    public void deleteRegistration(Long id) {
        Registration registration = findById(id);
        if (registration != null) {
            registrationRepository.deleteById(id);
            // Update event registration count
            eventService.updateEventRegistrationCount(registration.getEvent().getId());
        }
    }
    
    public void cancelRegistrationForUser(Long userId, Long eventId) {
        Registration registration = findByUserIdAndEventId(userId, eventId);
        if (registration == null) {
            throw new IllegalStateException("Registration not found");
        }

        registrationRepository.deleteByUserIdAndEventId(userId, eventId);
        eventService.updateEventRegistrationCount(eventId);
    }

    public int countByEventId(Long eventId) {
        return registrationRepository.countByEventId(eventId);
    }

    public long countByUserId(Long userId) {
        return registrationRepository.countByUserId(userId);
    }

    public long countUpcomingRegistrationsForUser(Long userId, LocalDateTime referenceDate) {
        return registrationRepository.countByUserIdAndEventEventDateAfter(userId, referenceDate);
    }

    public List<Registration> findUpcomingRegistrationsForUser(Long userId, LocalDateTime referenceDate, int limit) {
        return registrationRepository.findTop5ByUserIdAndEventEventDateAfterOrderByEventEventDateAsc(userId, referenceDate).stream()
            .limit(limit)
            .collect(Collectors.toList());
    }

    public long countByEventIds(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return 0L;
        }
        return registrationRepository.countByEventIdIn(eventIds);
    }

    public List<Registration> findRecentRegistrationsForEvents(List<Long> eventIds, int limit) {
        if (eventIds == null || eventIds.isEmpty()) {
            return Collections.emptyList();
        }
        return registrationRepository.findTop5ByEventIdInOrderByRegisteredAtDesc(eventIds).stream()
            .limit(limit)
            .collect(Collectors.toList());
    }
}