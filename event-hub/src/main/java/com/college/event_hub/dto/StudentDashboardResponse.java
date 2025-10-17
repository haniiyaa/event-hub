package com.college.event_hub.dto;

import com.college.event_hub.model.Instruction;
import com.college.event_hub.model.Registration;
import com.college.event_hub.model.User;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import java.util.stream.Collectors;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentDashboardResponse {
    private UserResponse user;
    private Metrics metrics;
    private List<RegistrationSummary> upcomingRegistrations;
    private List<EventSummaryResponse> recommendedEvents;
    private List<InstructionSummary> recentInstructions;

    public UserResponse getUser() {
        return user;
    }

    public void setUser(UserResponse user) {
        this.user = user;
    }

    public Metrics getMetrics() {
        return metrics;
    }

    public void setMetrics(Metrics metrics) {
        this.metrics = metrics;
    }

    public List<RegistrationSummary> getUpcomingRegistrations() {
        return upcomingRegistrations;
    }

    public void setUpcomingRegistrations(List<RegistrationSummary> upcomingRegistrations) {
        this.upcomingRegistrations = upcomingRegistrations;
    }

    public List<EventSummaryResponse> getRecommendedEvents() {
        return recommendedEvents;
    }

    public void setRecommendedEvents(List<EventSummaryResponse> recommendedEvents) {
        this.recommendedEvents = recommendedEvents;
    }

    public List<InstructionSummary> getRecentInstructions() {
        return recentInstructions;
    }

    public void setRecentInstructions(List<InstructionSummary> recentInstructions) {
        this.recentInstructions = recentInstructions;
    }

    public static StudentDashboardResponse from(
        User user,
        Metrics metrics,
        List<Registration> upcomingRegistrations,
        List<com.college.event_hub.model.Event> recommendedEvents,
        List<Instruction> recentInstructions
    ) {
        StudentDashboardResponse response = new StudentDashboardResponse();
        response.setUser(UserResponse.from(user));
        response.setMetrics(metrics);
        response.setUpcomingRegistrations(
            upcomingRegistrations.stream()
                .map(RegistrationSummary::from)
                .collect(Collectors.toList())
        );
        response.setRecommendedEvents(
            recommendedEvents.stream()
                .map(EventSummaryResponse::from)
                .collect(Collectors.toList())
        );
        response.setRecentInstructions(
            recentInstructions.stream()
                .map(InstructionSummary::from)
                .collect(Collectors.toList())
        );
        return response;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class Metrics {
        private long totalRegistrations;
        private long upcomingRegistrations;
        private long pendingInstructions;

        public long getTotalRegistrations() {
            return totalRegistrations;
        }

        public void setTotalRegistrations(long totalRegistrations) {
            this.totalRegistrations = totalRegistrations;
        }

        public long getUpcomingRegistrations() {
            return upcomingRegistrations;
        }

        public void setUpcomingRegistrations(long upcomingRegistrations) {
            this.upcomingRegistrations = upcomingRegistrations;
        }

        public long getPendingInstructions() {
            return pendingInstructions;
        }

        public void setPendingInstructions(long pendingInstructions) {
            this.pendingInstructions = pendingInstructions;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class RegistrationSummary {
        private Long registrationId;
        private String status;
        private String registeredAt;
        private EventSummaryResponse event;

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

        public static RegistrationSummary from(Registration registration) {
            RegistrationSummary summary = new RegistrationSummary();
            summary.setRegistrationId(registration.getId());
            summary.setStatus(registration.getStatus() != null ? registration.getStatus().name() : null);
            summary.setRegisteredAt(registration.getRegisteredAt() != null ? registration.getRegisteredAt().toString() : null);
            summary.setEvent(EventSummaryResponse.from(registration.getEvent()));
            return summary;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class InstructionSummary {
        private Long instructionId;
        private String title;
        private String content;
        private Boolean important;
        private String createdAt;
        private EventReference event;

        public Long getInstructionId() {
            return instructionId;
        }

        public void setInstructionId(Long instructionId) {
            this.instructionId = instructionId;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getContent() {
            return content;
        }

        public void setContent(String content) {
            this.content = content;
        }

        public Boolean getImportant() {
            return important;
        }

        public void setImportant(Boolean important) {
            this.important = important;
        }

        public String getCreatedAt() {
            return createdAt;
        }

        public void setCreatedAt(String createdAt) {
            this.createdAt = createdAt;
        }

        public EventReference getEvent() {
            return event;
        }

        public void setEvent(EventReference event) {
            this.event = event;
        }

        public static InstructionSummary from(Instruction instruction) {
            InstructionSummary summary = new InstructionSummary();
            summary.setInstructionId(instruction.getId());
            summary.setTitle(instruction.getTitle());
            summary.setContent(instruction.getContent());
            summary.setImportant(instruction.getIsImportant());
            summary.setCreatedAt(instruction.getCreatedAt() != null ? instruction.getCreatedAt().toString() : null);
            summary.setEvent(EventReference.from(instruction));
            return summary;
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class EventReference {
        private Long id;
        private String title;
        private String eventDate;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public String getEventDate() {
            return eventDate;
        }

        public void setEventDate(String eventDate) {
            this.eventDate = eventDate;
        }

        private static EventReference from(Instruction instruction) {
            if (instruction.getEvent() == null) {
                return null;
            }
            EventReference reference = new EventReference();
            reference.setId(instruction.getEvent().getId());
            reference.setTitle(instruction.getEvent().getTitle());
            reference.setEventDate(instruction.getEvent().getEventDate() != null ? instruction.getEvent().getEventDate().toString() : null);
            return reference;
        }
    }
}
