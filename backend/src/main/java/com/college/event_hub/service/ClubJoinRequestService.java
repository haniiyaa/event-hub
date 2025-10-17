package com.college.event_hub.service;

import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.RequestType;
import com.college.event_hub.model.ClubJoinRequest.Status;
import com.college.event_hub.model.ClubMembership;
import com.college.event_hub.model.ClubMembership.Role;
import com.college.event_hub.model.Club;
import com.college.event_hub.model.User;
import com.college.event_hub.repository.ClubJoinRequestRepository;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClubJoinRequestService {

    private final ClubJoinRequestRepository joinRequestRepository;
    private final ClubMembershipService membershipService;

    public ClubJoinRequestService(ClubJoinRequestRepository joinRequestRepository,
                                  ClubMembershipService membershipService) {
        this.joinRequestRepository = joinRequestRepository;
        this.membershipService = membershipService;
    }

    public Optional<ClubJoinRequest> findById(Long id) {
        return joinRequestRepository.findById(id);
    }

    public List<ClubJoinRequest> findByRequester(Long requesterId) {
        return joinRequestRepository.findByRequesterId(requesterId);
    }

    public List<ClubJoinRequest> findPendingForClub(Long clubId) {
        return joinRequestRepository.findByTargetClubIdAndStatus(clubId, Status.PENDING);
    }

    public List<ClubJoinRequest> findByClub(Long clubId) {
        return joinRequestRepository.findByTargetClubId(clubId);
    }

    public List<ClubJoinRequest> findByClubAndStatus(Long clubId, Status status) {
        return joinRequestRepository.findByTargetClubIdAndStatus(clubId, status);
    }

    public List<ClubJoinRequest> findByType(RequestType type) {
        return joinRequestRepository.findByType(type);
    }

    public List<ClubJoinRequest> findByTypeAndStatus(RequestType type, Status status) {
        return joinRequestRepository.findByTypeAndStatus(type, status);
    }

    public List<ClubJoinRequest> findByTypeAndStatuses(RequestType type, Collection<Status> statuses) {
        return joinRequestRepository.findByTypeAndStatusIn(type, statuses);
    }

    public boolean hasPendingJoinRequest(Long requesterId, Long clubId) {
        return joinRequestRepository.existsByRequesterIdAndTargetClubIdAndStatusIn(
            requesterId,
            clubId,
            EnumSet.of(Status.PENDING)
        );
    }

    public boolean hasPendingClubCreation(Long requesterId) {
        return joinRequestRepository.existsByRequesterIdAndTypeAndStatusIn(
            requesterId,
            RequestType.CREATE_CLUB,
            EnumSet.of(Status.PENDING)
        );
    }

    @Transactional
    public ClubJoinRequest createRequest(ClubJoinRequest request) {
        if (request.getRequester() == null) {
            throw new IllegalArgumentException("Requester is required");
        }

        if (request.getType() == RequestType.JOIN_CLUB) {
            Club club = request.getTargetClub();
            if (club == null || club.getId() == null) {
                throw new IllegalArgumentException("Target club is required for join requests");
            }
            Long clubId = club.getId();
            Long userId = request.getRequester().getId();
            if (membershipService.isMember(clubId, userId)) {
                throw new IllegalStateException("User is already a member of this club");
            }
            if (hasPendingJoinRequest(userId, clubId)) {
                throw new IllegalStateException("User already has a pending join request for this club");
            }
        } else if (request.getType() == RequestType.CREATE_CLUB) {
            if (hasPendingClubCreation(request.getRequester().getId())) {
                throw new IllegalStateException("Requester already has a pending club creation request");
            }
        }

        request.setStatus(Status.PENDING);
        request.setCreatedAt(LocalDateTime.now());
        request.setReviewedAt(null);
        request.setReviewer(null);
        return joinRequestRepository.save(request);
    }

    @Transactional
    public ClubJoinRequest approveRequest(Long requestId, User reviewer) {
        ClubJoinRequest request = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        ensurePending(request);
        request.setStatus(Status.APPROVED);
        request.setReviewer(reviewer);
        request.setReviewedAt(LocalDateTime.now());

        if (request.getType() == RequestType.JOIN_CLUB && request.getTargetClub() != null) {
            Club club = request.getTargetClub();
            User requester = request.getRequester();
            if (!membershipService.isMember(club.getId(), requester.getId())) {
                ClubMembership membership = new ClubMembership();
                membership.setClub(club);
                membership.setUser(requester);
                membership.setRole(Role.MEMBER);
                membershipService.save(membership);
            }
        }

        return joinRequestRepository.save(request);
    }

    @Transactional
    public ClubJoinRequest approveClubCreationRequest(Long requestId, User reviewer, Club club) {
        if (club == null || club.getId() == null) {
            throw new IllegalArgumentException("Created club must be provided");
        }

        ClubJoinRequest request = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        if (request.getType() != RequestType.CREATE_CLUB) {
            throw new IllegalStateException("Request is not a club creation request");
        }

        ensurePending(request);
        request.setTargetClub(club);
        request.setStatus(Status.APPROVED);
        request.setReviewer(reviewer);
        request.setReviewedAt(LocalDateTime.now());

        club.setStatus(Club.Status.ACTIVE);

        User requester = request.getRequester();
        if (requester != null && !membershipService.isMember(club.getId(), requester.getId())) {
            ClubMembership membership = new ClubMembership();
            membership.setClub(club);
            membership.setUser(requester);
            membership.setRole(Role.OFFICER);
            membershipService.save(membership);
        }

        return joinRequestRepository.save(request);
    }

    @Transactional
    public ClubJoinRequest rejectRequest(Long requestId, User reviewer, String message) {
        ClubJoinRequest request = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        ensurePending(request);
        request.setStatus(Status.REJECTED);
        request.setReviewer(reviewer);
        request.setReviewedAt(LocalDateTime.now());
        if (message != null && !message.isBlank()) {
            request.setMessage(message);
        }
        return joinRequestRepository.save(request);
    }

    @Transactional
    public ClubJoinRequest cancelRequest(Long requestId) {
        ClubJoinRequest request = joinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        ensurePending(request);
        request.setStatus(Status.CANCELLED);
        request.setReviewedAt(LocalDateTime.now());
        return joinRequestRepository.save(request);
    }

    private void ensurePending(ClubJoinRequest request) {
        if (request.getStatus() != Status.PENDING) {
            throw new IllegalStateException("Request is not pending");
        }
    }
}
