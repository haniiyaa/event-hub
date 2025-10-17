package com.college.event_hub.dto;

import jakarta.validation.constraints.Size;

public class InstructionUpdateRequest {

    @Size(max = 255, message = "Instruction title must be at most 255 characters")
    private String title;

    private String content;

    private Boolean isImportant;

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

    public Boolean getIsImportant() {
        return isImportant;
    }

    public void setIsImportant(Boolean isImportant) {
        this.isImportant = isImportant;
    }
}
