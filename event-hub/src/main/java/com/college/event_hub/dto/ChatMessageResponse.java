package com.college.event_hub.dto;

import com.college.event_hub.model.ChatMessage;
import com.college.event_hub.model.User;
import java.time.LocalDateTime;

public class ChatMessageResponse {

    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private Author author;

    public static ChatMessageResponse from(ChatMessage message) {
        ChatMessageResponse response = new ChatMessageResponse();
        response.setId(message.getId());
        response.setContent(message.getContent());
        response.setCreatedAt(message.getCreatedAt());
        response.setAuthor(Author.from(message.getAuthor()));
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public Author getAuthor() {
        return author;
    }

    public void setAuthor(Author author) {
        this.author = author;
    }

    public static class Author {
        private Long id;
        private String username;
        private String fullName;

        public static Author from(User user) {
            Author author = new Author();
            if (user != null) {
                author.setId(user.getId());
                author.setUsername(user.getUsername());
                author.setFullName(user.getFullName());
            }
            return author;
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
    }
}
