package com.college.event_hub.repository;

import com.college.event_hub.model.ClubMembership;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubMembershipRepository extends JpaRepository<ClubMembership, Long> {
    Optional<ClubMembership> findByClubIdAndUserId(Long clubId, Long userId);
    List<ClubMembership> findByClubId(Long clubId);
    List<ClubMembership> findByUserId(Long userId);
    boolean existsByClubIdAndUserId(Long clubId, Long userId);
}
