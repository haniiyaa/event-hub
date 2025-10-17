package com.college.event_hub.repository;

import com.college.event_hub.model.Club;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ClubRepository extends JpaRepository<Club, Long> {
    Optional<Club> findByAdminId(Long adminId);
    boolean existsByAdminId(Long adminId);
    boolean existsByAdminIdAndStatus(Long adminId, Club.Status status);
    Optional<Club> findFirstByAdminIdAndStatus(Long adminId, Club.Status status);
    Optional<Club> findFirstByAdminIdAndStatusIn(Long adminId, Collection<Club.Status> statuses);
    List<Club> findByStatusIn(Collection<Club.Status> statuses);
    List<Club> findByStatus(Club.Status status);
}