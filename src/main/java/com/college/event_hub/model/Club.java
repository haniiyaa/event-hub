package com.college.event_hub.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "clubs")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Club {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "admin_id", nullable = false)
    @JsonIgnoreProperties({"adminClubs", "registrations"})
    private User admin;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "club", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("club")
    private List<Event> events;
    
    // Constructors
    public Club() {}
    
    public Club(String name, String description, User admin) {
        this.name = name;
        this.description = description;
        this.admin = admin;
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public User getAdmin() { return admin; }
    public void setAdmin(User admin) { this.admin = admin; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public List<Event> getEvents() { return events; }
    public void setEvents(List<Event> events) { this.events = events; }
}