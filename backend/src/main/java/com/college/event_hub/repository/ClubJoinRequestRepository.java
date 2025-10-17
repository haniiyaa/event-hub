package com.college.event_hub.repository;

import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.RequestType;
import com.college.event_hub.model.ClubJoinRequest.Status;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClubJoinRequestRepository extends JpaRepository<ClubJoinRequest, Long> {
    List<ClubJoinRequest> findByTargetClubIdAndStatus(Long clubId, Status status);
    List<ClubJoinRequest> findByTargetClubId(Long clubId);
    List<ClubJoinRequest> findByRequesterId(Long requesterId);
    List<ClubJoinRequest> findByRequesterIdAndStatus(Long requesterId, Status status);
    List<ClubJoinRequest> findByTypeAndStatus(RequestType type, Status status);
    List<ClubJoinRequest> findByType(RequestType type);
    List<ClubJoinRequest> findByTypeAndStatusIn(RequestType type, Collection<Status> statuses);
    Optional<ClubJoinRequest> findFirstByRequesterIdAndTargetClubIdAndStatus(Long requesterId, Long clubId, Status status);
    boolean existsByRequesterIdAndTargetClubIdAndStatusIn(Long requesterId, Long clubId, Collection<Status> statuses);
    boolean existsByRequesterIdAndTypeAndStatusIn(Long requesterId, RequestType type, Collection<Status> statuses);
}
