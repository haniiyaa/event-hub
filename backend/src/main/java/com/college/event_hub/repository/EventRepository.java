package com.college.event_hub.repository;

import com.college.event_hub.model.Event;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByClubId(Long clubId);
    List<Event> findByClubAdminId(Long adminId);
    List<Event> findTop5ByEventDateAfterOrderByEventDateAsc(LocalDateTime referenceDate);
    List<Event> findTop10ByEventDateAfterOrderByEventDateAsc(LocalDateTime referenceDate);
    List<Event> findTop5ByClub_Admin_IdAndEventDateAfterOrderByEventDateAsc(Long adminId, LocalDateTime referenceDate);
    long countByClub_Admin_Id(Long adminId);
    long countByClub_Admin_IdAndEventDateAfter(Long adminId, LocalDateTime referenceDate);
}