package com.college.event_hub.dto;

import jakarta.validation.constraints.NotBlank;

public class ClubStatusUpdateRequest {

    @NotBlank(message = "Status is required")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
