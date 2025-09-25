package com.college.event_hub.service;

import com.college.event_hub.model.Registration;
import com.college.event_hub.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
    
    public int countByEventId(Long eventId) {
        return registrationRepository.countByEventId(eventId);
    }
}