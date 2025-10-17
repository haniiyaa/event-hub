package com.college.event_hub.repository;

import com.college.event_hub.model.ClubInvite;
import com.college.event_hub.model.ClubInvite.Status;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubInviteRepository extends JpaRepository<ClubInvite, Long> {
    Optional<ClubInvite> findByInviteCode(String inviteCode);
    List<ClubInvite> findByClubId(Long clubId);
    List<ClubInvite> findByClubIdAndStatus(Long clubId, Status status);
    List<ClubInvite> findByInviteeEmailAndStatus(String email, Status status);
    boolean existsByInviteCodeAndStatus(String inviteCode, Status status);
}
