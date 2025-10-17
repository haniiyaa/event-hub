package com.college.event_hub.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;
    
    @Column(nullable = false)
    private String email;
    
    @Column(name = "full_name")
    private String fullName;
    
    @Column(name = "phone_number")
    private String phoneNumber;

    @Column(name = "class_details", nullable = false, length = 100)
    private String classDetails = "UNSPECIFIED";
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.STUDENT;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @OneToMany(mappedBy = "admin", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("admin")
    private List<Club> adminClubs;
    
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("user")
    private List<Registration> registrations;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("user")
    private List<ClubMembership> memberships;

    @OneToMany(mappedBy = "requester", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("requester")
    private List<ClubJoinRequest> joinRequests;

    @OneToMany(mappedBy = "reviewer", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("reviewer")
    private List<ClubJoinRequest> reviewedJoinRequests;

    @OneToMany(mappedBy = "inviter", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("inviter")
    private List<ClubInvite> sentInvites;

    @OneToMany(mappedBy = "invitee", cascade = CascadeType.ALL)
    @JsonIgnoreProperties("invitee")
    private List<ClubInvite> receivedInvites;
    
    public enum Role {
        STUDENT, CLUB_ADMIN, ADMIN
    }
    
    // Constructors
    public User() {}
    
    public User(String username, String password, String email, String fullName) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
    }
    
    public User(String username, String password, String email, String fullName, String phoneNumber) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
    }

    public User(String username, String password, String email, String fullName, String phoneNumber, String classDetails) {
        this.username = username;
        this.password = password;
        this.email = email;
        this.fullName = fullName;
        this.phoneNumber = phoneNumber;
        setClassDetails(classDetails);
    }
    
    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getPhoneNumber() { return phoneNumber; }
    public void setPhoneNumber(String phoneNumber) { this.phoneNumber = phoneNumber; }

    public String getClassDetails() { return classDetails; }
    public void setClassDetails(String classDetails) {
        if (classDetails == null) {
            this.classDetails = "UNSPECIFIED";
        } else {
            String trimmed = classDetails.trim();
            this.classDetails = trimmed.isEmpty() ? "UNSPECIFIED" : trimmed;
        }
    }
    
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    
    public List<Club> getAdminClubs() { return adminClubs; }
    public void setAdminClubs(List<Club> adminClubs) { this.adminClubs = adminClubs; }
    
    public List<Registration> getRegistrations() { return registrations; }
    public void setRegistrations(List<Registration> registrations) { this.registrations = registrations; }

    public List<ClubMembership> getMemberships() { return memberships; }
    public void setMemberships(List<ClubMembership> memberships) { this.memberships = memberships; }

    public List<ClubJoinRequest> getJoinRequests() { return joinRequests; }
    public void setJoinRequests(List<ClubJoinRequest> joinRequests) { this.joinRequests = joinRequests; }

    public List<ClubJoinRequest> getReviewedJoinRequests() { return reviewedJoinRequests; }
    public void setReviewedJoinRequests(List<ClubJoinRequest> reviewedJoinRequests) { this.reviewedJoinRequests = reviewedJoinRequests; }

    public List<ClubInvite> getSentInvites() { return sentInvites; }
    public void setSentInvites(List<ClubInvite> sentInvites) { this.sentInvites = sentInvites; }

    public List<ClubInvite> getReceivedInvites() { return receivedInvites; }
    public void setReceivedInvites(List<ClubInvite> receivedInvites) { this.receivedInvites = receivedInvites; }
}