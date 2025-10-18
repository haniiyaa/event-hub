package com.college.event_hub.repository;

import com.college.event_hub.model.ChatThread;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ChatThreadRepository extends JpaRepository<ChatThread, Long> {

    Optional<ChatThread> findByScopeAndClubId(ChatThread.Scope scope, Long clubId);

    Optional<ChatThread> findByScopeAndEventId(ChatThread.Scope scope, Long eventId);
}
