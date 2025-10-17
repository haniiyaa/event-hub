package com.college.event_hub.dto;

import com.college.event_hub.validation.FutureEventDate;
import com.college.event_hub.validation.ValidCapacity;
import jakarta.validation.constraints.Size;

public class EventUpdateRequest {

    @Size(max = 255, message = "Event title must be at most 255 characters")
    private String title;

    private String description;

    @FutureEventDate(message = "Event date must be ISO-8601 and in the future")
    private String eventDate;

    private String location;

    @ValidCapacity
    private Integer capacity;

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
}
