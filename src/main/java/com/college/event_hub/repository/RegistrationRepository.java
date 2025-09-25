package com.college.event_hub.repository;

import com.college.event_hub.model.Registration;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByEventId(Long eventId);
    List<Registration> findByUserId(Long userId);
    Optional<Registration> findByUserIdAndEventId(Long userId, Long eventId);
    boolean existsByUserIdAndEventId(Long userId, Long eventId);
    int countByEventId(Long eventId);
}