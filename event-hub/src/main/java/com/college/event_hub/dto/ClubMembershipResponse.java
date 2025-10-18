package com.college.event_hub.dto;

import com.college.event_hub.model.ClubMembership;
import com.college.event_hub.model.ClubMembership.Role;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.User;
import java.time.LocalDateTime;

public class ClubMembershipResponse {

    private Long id;
    private Role role;
    private LocalDateTime joinedAt;
    private SimpleClub club;
    private SimpleUser member;

    public static ClubMembershipResponse from(ClubMembership membership) {
        ClubMembershipResponse response = new ClubMembershipResponse();
        response.setId(membership.getId());
        response.setRole(membership.getRole());
        response.setJoinedAt(membership.getJoinedAt());
        response.setClub(SimpleClub.from(membership.getClub()));
        response.setMember(SimpleUser.from(membership.getUser()));
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getJoinedAt() {
        return joinedAt;
    }

    public void setJoinedAt(LocalDateTime joinedAt) {
        this.joinedAt = joinedAt;
    }

    public SimpleClub getClub() {
        return club;
    }

    public void setClub(SimpleClub club) {
        this.club = club;
    }

    public SimpleUser getMember() {
        return member;
    }

    public void setMember(SimpleUser member) {
        this.member = member;
    }

    public static class SimpleClub {
        private Long id;
        private String name;
        private String description;
        private Club.Status status;

        public static SimpleClub from(Club club) {
            if (club == null) {
                return null;
            }
            SimpleClub simpleClub = new SimpleClub();
            simpleClub.setId(club.getId());
            simpleClub.setName(club.getName());
            simpleClub.setDescription(club.getDescription());
            simpleClub.setStatus(club.getStatus());
            return simpleClub;
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
