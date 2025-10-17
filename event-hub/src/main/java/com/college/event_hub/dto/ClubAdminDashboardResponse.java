package com.college.event_hub.dto;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.Event;
import com.college.event_hub.model.Registration;
import com.college.event_hub.model.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClubAdminDashboardResponse {
    private boolean hasClub;
    private String message;
    private ClubSummary club;
    private Metrics metrics;
    private List<EventSummaryResponse> upcomingEvents;
    private List<RegistrationSummary> recentRegistrations;

    public boolean isHasClub() {
        return hasClub;
    }

    public void setHasClub(boolean hasClub) {
        this.hasClub = hasClub;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ClubSummary getClub() {
        return club;
    }

    public void setClub(ClubSummary club) {
        this.club = club;
    }

    public Metrics getMetrics() {
        return metrics;
    }

    public void setMetrics(Metrics metrics) {
        this.metrics = metrics;
    }

    public List<EventSummaryResponse> getUpcomingEvents() {
        return upcomingEvents;
    }

    public void setUpcomingEvents(List<EventSummaryResponse> upcomingEvents) {
        this.upcomingEvents = upcomingEvents;
    }

    public List<RegistrationSummary> getRecentRegistrations() {
        return recentRegistrations;
    }

    public void setRecentRegistrations(List<RegistrationSummary> recentRegistrations) {
        this.recentRegistrations = recentRegistrations;
    }

    public static ClubAdminDashboardResponse noClub(String message) {
        ClubAdminDashboardResponse response = new ClubAdminDashboardResponse();
        response.setHasClub(false);
        response.setMessage(message);
        response.setUpcomingEvents(Collections.emptyList());
        response.setRecentRegistrations(Collections.emptyList());
        return response;
    }

    public static ClubAdminDashboardResponse from(
        Club club,
        Metrics metrics,
        List<Event> upcomingEvents,
        List<Registration> recentRegistrations
    ) {
        ClubAdminDashboardResponse response = new ClubAdminDashboardResponse();
        response.setHasClub(true);
        response.setClub(ClubSummary.from(club));
        response.setMetrics(metrics);
        response.setUpcomingEvents(
            upcomingEvents.stream()
                .map(EventSummaryResponse::from)
                .collect(Collectors.toList())
        );
        response.setRecentRegistrations(
            recentRegistrations.stream()
                .map(RegistrationSummary::from)
                .collect(Collectors.toList())
        );
        return response;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ClubSummary {
        private Long id;
        private String name;
        private String description;
        private String createdAt;
    private Club.Status status;

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

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public Club.Status getStatus() {
            return status;
        }

        public void setStatus(Club.Status status) {
            this.status = status;
        }

        public static ClubSummary from(Club club) {
            ClubSummary summary = new ClubSummary();
            summary.setId(club.getId());
            summary.setName(club.getName());
            summary.setDescription(club.getDescription());
            summary.setCreatedAt(club.getCreatedAt() != null ? club.getCreatedAt().toString() : null);
            summary.setStatus(club.getStatus());
            return summary;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Metrics {
        private long totalEvents;
        private long upcomingEvents;
        private long totalRegistrations;
        private long instructionCount;

        public long getTotalEvents() {
            return totalEvents;
        }

        public void setTotalEvents(long totalEvents) {
            this.totalEvents = totalEvents;
        }

        public long getUpcomingEvents() {
            return upcomingEvents;
        }

        public void setUpcomingEvents(long upcomingEvents) {
            this.upcomingEvents = upcomingEvents;
        }

        public long getTotalRegistrations() {
            return totalRegistrations;
        }

        public void setTotalRegistrations(long totalRegistrations) {
            this.totalRegistrations = totalRegistrations;
        }

        public long getInstructionCount() {
            return instructionCount;
        }

        public void setInstructionCount(long instructionCount) {
            this.instructionCount = instructionCount;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RegistrationSummary {
        private Long registrationId;
        private String status;
        private String registeredAt;
        private EventSummaryResponse event;
        private AttendeeSummary attendee;

        public Long getRegistrationId() {
            return registrationId;
        }

        public void setRegistrationId(Long registrationId) {
            this.registrationId = registrationId;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }

        public String getRegisteredAt() {
            return registeredAt;
        }

        public void setRegisteredAt(String registeredAt) {
            this.registeredAt = registeredAt;
        }

        public EventSummaryResponse getEvent() {
            return event;
        }

        public void setEvent(EventSummaryResponse event) {
            this.event = event;
        }

        public AttendeeSummary getAttendee() {
            return attendee;
        }

        public void setAttendee(AttendeeSummary attendee) {
            this.attendee = attendee;
        }

        public static RegistrationSummary from(Registration registration) {
            RegistrationSummary summary = new RegistrationSummary();
            summary.setRegistrationId(registration.getId());
            summary.setStatus(registration.getStatus() != null ? registration.getStatus().name() : null);
            summary.setRegisteredAt(registration.getRegisteredAt() != null ? registration.getRegisteredAt().toString() : null);
            summary.setEvent(EventSummaryResponse.from(registration.getEvent()));
            summary.setAttendee(AttendeeSummary.from(registration.getUser()));
            return summary;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class AttendeeSummary {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phoneNumber;
        private String classDetails;

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

        public static AttendeeSummary from(User user) {
            if (user == null) {
                return null;
            }
            AttendeeSummary summary = new AttendeeSummary();
            summary.setId(user.getId());
            summary.setUsername(user.getUsername());
            summary.setFullName(user.getFullName());
            summary.setEmail(user.getEmail());
            summary.setPhoneNumber(user.getPhoneNumber());
            summary.setClassDetails(user.getClassDetails());
            return summary;
        }
    }
}
