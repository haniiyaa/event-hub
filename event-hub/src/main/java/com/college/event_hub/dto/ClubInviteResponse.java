package com.college.event_hub.dto;

import com.college.event_hub.model.ClubInvite;
import com.college.event_hub.model.ClubInvite.Status;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.User;
import java.time.LocalDateTime;

public class ClubInviteResponse {

    private Long id;
    private String inviteCode;
    private Status status;
    private String inviteeEmail;
    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;
    private LocalDateTime respondedAt;
    private SimpleClub club;
    private SimpleUser inviter;
    private SimpleUser invitee;

    public static ClubInviteResponse from(ClubInvite invite) {
        ClubInviteResponse response = new ClubInviteResponse();
        response.setId(invite.getId());
        response.setInviteCode(invite.getInviteCode());
        response.setStatus(invite.getStatus());
        response.setInviteeEmail(invite.getInviteeEmail());
        response.setCreatedAt(invite.getCreatedAt());
        response.setExpiresAt(invite.getExpiresAt());
        response.setRespondedAt(invite.getRespondedAt());
        response.setClub(SimpleClub.from(invite.getClub()));
        response.setInviter(SimpleUser.from(invite.getInviter()));
        response.setInvitee(SimpleUser.from(invite.getInvitee()));
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getInviteCode() {
        return inviteCode;
    }

    public void setInviteCode(String inviteCode) {
        this.inviteCode = inviteCode;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getInviteeEmail() {
        return inviteeEmail;
    }

    public void setInviteeEmail(String inviteeEmail) {
        this.inviteeEmail = inviteeEmail;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(LocalDateTime expiresAt) {
        this.expiresAt = expiresAt;
    }

    public LocalDateTime getRespondedAt() {
        return respondedAt;
    }

    public void setRespondedAt(LocalDateTime respondedAt) {
        this.respondedAt = respondedAt;
    }

    public SimpleClub getClub() {
        return club;
    }

    public void setClub(SimpleClub club) {
        this.club = club;
    }

    public SimpleUser getInviter() {
        return inviter;
    }

    public void setInviter(SimpleUser inviter) {
        this.inviter = inviter;
    }

    public SimpleUser getInvitee() {
        return invitee;
    }

    public void setInvitee(SimpleUser invitee) {
        this.invitee = invitee;
    }

    public static class SimpleClub {
        private Long id;
        private String name;

        public static SimpleClub from(Club club) {
            if (club == null) {
                return null;
            }
            SimpleClub simpleClub = new SimpleClub();
            simpleClub.setId(club.getId());
            simpleClub.setName(club.getName());
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
