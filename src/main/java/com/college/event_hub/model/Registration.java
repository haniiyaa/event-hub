package com.college.event_hub.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "registrations")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"registrations", "adminClubs"})
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    @JsonIgnoreProperties({"registrations", "instructions"})
    private Event event;
    
    @Column(name = "registered_at")
    private LocalDateTime registeredAt = LocalDateTime.now();
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.REGISTERED;
    
    public enum Status {
        REGISTERED, ATTENDED, CANCELLED
    }
    
    // Constructors
    public Registration() {}
    
    public Registration(User user, Event event) {
        this.user = user;
        this.event = event;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    
    public Event getEvent() { return event; }
    public void setEvent(Event event) { this.event = event; }
    
    public LocalDateTime getRegisteredAt() { return registeredAt; }
    public void setRegisteredAt(LocalDateTime registeredAt) { this.registeredAt = registeredAt; }
    
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
}