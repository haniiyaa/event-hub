package com.college.event_hub.dto;

import com.college.event_hub.model.ChatThread;
import java.util.List;

public class ChatThreadResponse {

    private Long threadId;
    private ChatThread.Scope scope;
    private boolean canPost;
    private Long lastMessageId;
    private List<ChatMessageResponse> messages;

    public static ChatThreadResponse of(ChatThread thread, boolean canPost, List<ChatMessageResponse> messages) {
        ChatThreadResponse response = new ChatThreadResponse();
        response.setThreadId(thread != null ? thread.getId() : null);
        response.setScope(thread != null ? thread.getScope() : null);
        response.setCanPost(canPost);
        response.setMessages(messages);
        if (messages != null && !messages.isEmpty()) {
            response.setLastMessageId(messages.get(messages.size() - 1).getId());
        } else {
            response.setLastMessageId(null);
        }
        return response;
    }

    public Long getThreadId() {
        return threadId;
    }

    public void setThreadId(Long threadId) {
        this.threadId = threadId;
    }

    public ChatThread.Scope getScope() {
        return scope;
    }

    public void setScope(ChatThread.Scope scope) {
        this.scope = scope;
    }

    public boolean isCanPost() {
        return canPost;
    }

    public void setCanPost(boolean canPost) {
        this.canPost = canPost;
    }

    public Long getLastMessageId() {
        return lastMessageId;
    }

    public void setLastMessageId(Long lastMessageId) {
        this.lastMessageId = lastMessageId;
    }

    public List<ChatMessageResponse> getMessages() {
        return messages;
    }

    public void setMessages(List<ChatMessageResponse> messages) {
        this.messages = messages;
    }
}
