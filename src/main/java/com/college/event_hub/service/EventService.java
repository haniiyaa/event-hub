package com.college.event_hub.service;

import com.college.event_hub.model.Event;
import com.college.event_hub.repository.EventRepository;
import com.college.event_hub.repository.RegistrationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
}