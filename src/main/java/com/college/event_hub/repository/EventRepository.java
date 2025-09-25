package com.college.event_hub.repository;

import com.college.event_hub.model.Event;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface EventRepository extends JpaRepository<Event, Long> {
    List<Event> findByClubId(Long clubId);
    List<Event> findByClubAdminId(Long adminId);
}