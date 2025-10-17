package com.college.event_hub.dto;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.Event;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public class EventSummaryResponse {
    private Long id;
    private String title;
    private String description;
    private String eventDate;
    private String location;
    private Integer capacity;
    private Integer currentRegistrations;
    private ClubSummary club;

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

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getEventDate() {
        return eventDate;
    }

    public void setEventDate(String eventDate) {
        this.eventDate = eventDate;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public Integer getCurrentRegistrations() {
        return currentRegistrations;
    }

    public void setCurrentRegistrations(Integer currentRegistrations) {
        this.currentRegistrations = currentRegistrations;
    }

    public ClubSummary getClub() {
        return club;
    }

    public void setClub(ClubSummary club) {
        this.club = club;
    }

    public static EventSummaryResponse from(Event event) {
        if (event == null) {
            return null;
        }

        EventSummaryResponse response = new EventSummaryResponse();
        response.setId(event.getId());
        response.setTitle(event.getTitle());
        response.setDescription(event.getDescription());
        LocalDateTime eventDate = event.getEventDate();
        response.setEventDate(eventDate != null ? eventDate.toString() : null);
        response.setLocation(event.getLocation());
        response.setCapacity(event.getCapacity());
        response.setCurrentRegistrations(event.getCurrentRegistrations());
        response.setClub(ClubSummary.from(event.getClub()));
        return response;
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class ClubSummary {
        private Long id;
        private String name;
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

        public Club.Status getStatus() {
            return status;
        }

        public void setStatus(Club.Status status) {
            this.status = status;
        }

        public static ClubSummary from(Club club) {
            if (club == null) {
                return null;
            }
            ClubSummary summary = new ClubSummary();
            summary.setId(club.getId());
            summary.setName(club.getName());
            summary.setStatus(club.getStatus());
            return summary;
        }
    }
}
