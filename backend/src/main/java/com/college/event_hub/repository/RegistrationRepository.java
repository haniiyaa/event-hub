package com.college.event_hub.repository;

import com.college.event_hub.model.Registration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByEventId(Long eventId);
    List<Registration> findByUserId(Long userId);
    Optional<Registration> findByUserIdAndEventId(Long userId, Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
    int countByEventId(Long eventId);
    void deleteByUserIdAndEventId(Long userId, Long eventId);
    long countByUserId(Long userId);
    long countByUserIdAndEventEventDateAfter(Long userId, LocalDateTime referenceDate);
    long countByEventIdIn(List<Long> eventIds);
    List<Registration> findTop5ByUserIdAndEventEventDateAfterOrderByEventEventDateAsc(Long userId, LocalDateTime referenceDate);
    List<Registration> findTop5ByEventIdInOrderByRegisteredAtDesc(List<Long> eventIds);
}