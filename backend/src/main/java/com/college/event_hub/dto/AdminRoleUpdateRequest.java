package com.college.event_hub.dto;

import com.college.event_hub.model.User;
import jakarta.validation.constraints.NotBlank;

public class AdminRoleUpdateRequest {

    @NotBlank(message = "Role value is required")
    private String role;

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public User.Role toRoleEnum() {
        return User.Role.valueOf(role.toUpperCase());
    }
}
