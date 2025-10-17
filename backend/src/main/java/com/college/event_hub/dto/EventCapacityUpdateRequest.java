package com.college.event_hub.dto;

import com.college.event_hub.validation.ValidCapacity;
import jakarta.validation.constraints.NotNull;

public class EventCapacityUpdateRequest {

    @NotNull(message = "Capacity value is required")
    @ValidCapacity
    private Integer capacity;

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }
}
