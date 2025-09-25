package com.college.event_hub.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "events")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Event {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String title;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "event_date", nullable = false)
    private LocalDateTime eventDate;
    
    @Column(nullable = false)
    private String location;
    
    @Column(nullable = false)
    private Integer capacity;
    
    @Column(name = "current_registrations")
    private Integer currentRegistrations = 0;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "club_id", nullable = false)
    @JsonIgnoreProperties({"events", "admin"})
    private Club club;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("event")
    private List<Registration> registrations;
    
    @OneToMany(mappedBy = "event", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("event")
    private List<Instruction> instructions;
    
    // Constructors
    public Event() {}
    
    public Event(String title, String description, LocalDateTime eventDate, String location, Integer capacity, Club club) {
        this.title = title;
        this.description = description;
        this.eventDate = eventDate;
        this.location = location;
        this.capacity = capacity;
        this.club = club;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public LocalDateTime getEventDate() { return eventDate; }
    public void setEventDate(LocalDateTime eventDate) { this.eventDate = eventDate; }
    
    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }
    
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    
    public Integer getCurrentRegistrations() { return currentRegistrations; }
    public void setCurrentRegistrations(Integer currentRegistrations) { this.currentRegistrations = currentRegistrations; }
    
    public Club getClub() { return club; }
    public void setClub(Club club) { this.club = club; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public List<Registration> getRegistrations() { return registrations; }
    public void setRegistrations(List<Registration> registrations) { this.registrations = registrations; }
    
    public List<Instruction> getInstructions() { return instructions; }
    public void setInstructions(List<Instruction> instructions) { this.instructions = instructions; }
}