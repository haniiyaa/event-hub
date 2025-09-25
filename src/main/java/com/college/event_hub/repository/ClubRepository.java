package com.college.event_hub.repository;

import com.college.event_hub.model.Club;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {
    Optional<Club> findByAdminId(Long adminId);
    boolean existsByAdminId(Long adminId);
}