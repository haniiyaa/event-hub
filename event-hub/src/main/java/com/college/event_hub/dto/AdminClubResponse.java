package com.college.event_hub.dto;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.User;
import java.time.LocalDateTime;

public class AdminClubResponse {

    private Long id;
    private String name;
    private String description;
    private Club.Status status;
    private LocalDateTime createdAt;
    private SimpleUser admin;

    public static AdminClubResponse from(Club club) {
        if (club == null) {
            return null;
        }
        AdminClubResponse response = new AdminClubResponse();
        response.setId(club.getId());
        response.setName(club.getName());
        response.setDescription(club.getDescription());
        response.setStatus(club.getStatus());
        response.setCreatedAt(club.getCreatedAt());
        response.setAdmin(SimpleUser.from(club.getAdmin()));
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Club.Status getStatus() {
        return status;
    }

    public void setStatus(Club.Status status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public SimpleUser getAdmin() {
        return admin;
    }

    public void setAdmin(SimpleUser admin) {
        this.admin = admin;
    }

    public static class SimpleUser {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String classDetails;

        public static SimpleUser from(User user) {
            if (user == null) {
                return null;
            }
            SimpleUser simpleUser = new SimpleUser();
            simpleUser.setId(user.getId());
            simpleUser.setUsername(user.getUsername());
            simpleUser.setFullName(user.getFullName());
            simpleUser.setEmail(user.getEmail());
            simpleUser.setPhoneNumber(user.getPhoneNumber());
            simpleUser.setClassDetails(user.getClassDetails());
            return simpleUser;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getFullName() {
            return fullName;
        }

        public void setFullName(String fullName) {
            this.fullName = fullName;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getPhoneNumber() {
            return phoneNumber;
        }

        public void setPhoneNumber(String phoneNumber) {
            this.phoneNumber = phoneNumber;
        }

        public String getClassDetails() {
            return classDetails;
        }

        public void setClassDetails(String classDetails) {
            this.classDetails = classDetails;
        }
    }
}
