package com.college.event_hub.repository;

import com.college.event_hub.model.ChatMessage;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    List<ChatMessage> findTop50ByThreadIdOrderByIdDesc(Long threadId);

    List<ChatMessage> findByThreadIdAndIdGreaterThanOrderByIdAsc(Long threadId, Long messageId);
}
