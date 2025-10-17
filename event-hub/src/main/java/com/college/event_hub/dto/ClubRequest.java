package com.college.event_hub.dto;

import jakarta.validation.constraints.NotBlank;

public class ClubRequest {

    @NotBlank(message = "Club name is required")
    private String name;

    @NotBlank(message = "Club description is required")
    private String description;

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
}
