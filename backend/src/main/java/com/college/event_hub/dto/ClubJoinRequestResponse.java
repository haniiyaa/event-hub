package com.college.event_hub.dto;

import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.RequestType;
import com.college.event_hub.model.ClubJoinRequest.Status;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.User;
import java.time.LocalDateTime;

public class ClubJoinRequestResponse {

    private Long id;
    private RequestType type;
    private Status status;
    private String message;
    private String requestedName;
    private String requestedDescription;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private SimpleUser requester;
    private SimpleUser reviewer;
    private SimpleClub club;

    public static ClubJoinRequestResponse from(ClubJoinRequest request) {
        ClubJoinRequestResponse response = new ClubJoinRequestResponse();
        response.setId(request.getId());
        response.setType(request.getType());
        response.setStatus(request.getStatus());
        response.setMessage(request.getMessage());
        response.setRequestedName(request.getRequestedName());
        response.setRequestedDescription(request.getRequestedDescription());
        response.setCreatedAt(request.getCreatedAt());
        response.setReviewedAt(request.getReviewedAt());
        response.setRequester(SimpleUser.from(request.getRequester()));
        response.setReviewer(SimpleUser.from(request.getReviewer()));
        response.setClub(SimpleClub.from(request.getTargetClub()));
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public RequestType getType() {
        return type;
    }

    public void setType(RequestType type) {
        this.type = type;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getRequestedName() {
        return requestedName;
    }

    public void setRequestedName(String requestedName) {
        this.requestedName = requestedName;
    }

    public String getRequestedDescription() {
        return requestedDescription;
    }

    public void setRequestedDescription(String requestedDescription) {
        this.requestedDescription = requestedDescription;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(LocalDateTime reviewedAt) {
        this.reviewedAt = reviewedAt;
    }

    public SimpleUser getRequester() {
        return requester;
    }

    public void setRequester(SimpleUser requester) {
        this.requester = requester;
    }

    public SimpleUser getReviewer() {
        return reviewer;
    }

    public void setReviewer(SimpleUser reviewer) {
        this.reviewer = reviewer;
    }

    public SimpleClub getClub() {
        return club;
    }

    public void setClub(SimpleClub club) {
        this.club = club;
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
}
