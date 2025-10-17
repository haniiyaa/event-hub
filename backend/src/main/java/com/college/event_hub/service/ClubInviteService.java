package com.college.event_hub.service;

import com.college.event_hub.model.ClubInvite;
import com.college.event_hub.model.ClubInvite.Status;
import com.college.event_hub.model.ClubMembership;
import com.college.event_hub.model.ClubMembership.Role;
import com.college.event_hub.model.User;
import com.college.event_hub.repository.ClubInviteRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClubInviteService {

    private final ClubInviteRepository inviteRepository;
    private final ClubMembershipService membershipService;

    public ClubInviteService(ClubInviteRepository inviteRepository,
                             ClubMembershipService membershipService) {
        this.inviteRepository = inviteRepository;
        this.membershipService = membershipService;
    }

    public Optional<ClubInvite> findById(Long id) {
        return inviteRepository.findById(id);
    }

    public Optional<ClubInvite> findByCode(String inviteCode) {
        return inviteRepository.findByInviteCode(inviteCode);
    }

    public List<ClubInvite> findByClub(Long clubId) {
        return inviteRepository.findByClubId(clubId);
    }

    public List<ClubInvite> findPendingInvitesForEmail(String email) {
        return inviteRepository.findByInviteeEmailAndStatus(email.toLowerCase(), Status.PENDING);
    }

    @Transactional
    public ClubInvite createInvite(ClubInvite invite) {
        if (invite.getInviteeEmail() == null || invite.getInviteeEmail().isBlank()) {
            throw new IllegalArgumentException("Invitee email is required");
        }

        invite.setInviteeEmail(invite.getInviteeEmail().trim().toLowerCase());
        if (invite.getInviteCode() == null || invite.getInviteCode().isBlank()) {
            invite.setInviteCode(generateCode());
        }
        invite.setStatus(Status.PENDING);
        invite.setCreatedAt(LocalDateTime.now());
        if (invite.getExpiresAt() == null) {
            invite.setExpiresAt(LocalDateTime.now().plusWeeks(2));
        }
        return inviteRepository.save(invite);
    }

    @Transactional
    public ClubInvite acceptInvite(String inviteCode, User user) {
        ClubInvite invite = inviteRepository.findByInviteCode(inviteCode)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found"));
        ensurePending(invite);
        if (isExpired(invite)) {
            invite.setStatus(Status.EXPIRED);
            invite.setRespondedAt(LocalDateTime.now());
            return inviteRepository.save(invite);
        }
        if (invite.getInvitee() != null && !invite.getInvitee().getId().equals(user.getId())) {
            throw new IllegalStateException("Invite is not addressed to this user");
        }
        if (invite.getInvitee() == null) {
            invite.setInvitee(user);
        }
        if (user.getEmail() != null) {
            invite.setInviteeEmail(user.getEmail().toLowerCase());
        }
        invite.setStatus(Status.ACCEPTED);
        invite.setRespondedAt(LocalDateTime.now());

        if (!membershipService.isMember(invite.getClub().getId(), user.getId())) {
            ClubMembership membership = new ClubMembership();
            membership.setClub(invite.getClub());
            membership.setUser(user);
            membership.setRole(Role.MEMBER);
            membershipService.save(membership);
        }

        return inviteRepository.save(invite);
    }

    @Transactional
    public ClubInvite declineInvite(String inviteCode, User user) {
        ClubInvite invite = inviteRepository.findByInviteCode(inviteCode)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found"));
        ensurePending(invite);
        if (isExpired(invite)) {
            invite.setStatus(Status.EXPIRED);
            invite.setRespondedAt(LocalDateTime.now());
            return inviteRepository.save(invite);
        }
        if (invite.getInvitee() != null && !invite.getInvitee().getId().equals(user.getId())) {
            throw new IllegalStateException("Invite is not addressed to this user");
        }
        invite.setInvitee(user);
        if (user.getEmail() != null) {
            invite.setInviteeEmail(user.getEmail().toLowerCase());
        }
        invite.setStatus(Status.DECLINED);
        invite.setRespondedAt(LocalDateTime.now());
        return inviteRepository.save(invite);
    }

    @Transactional
    public ClubInvite expireInvite(Long inviteId) {
        ClubInvite invite = inviteRepository.findById(inviteId)
            .orElseThrow(() -> new IllegalArgumentException("Invite not found"));
        if (invite.getStatus() == Status.PENDING) {
            invite.setStatus(Status.EXPIRED);
            invite.setRespondedAt(LocalDateTime.now());
            return inviteRepository.save(invite);
        }
        return invite;
    }

    private void ensurePending(ClubInvite invite) {
        if (invite.getStatus() != Status.PENDING) {
            throw new IllegalStateException("Invite is not pending");
        }
    }

    private boolean isExpired(ClubInvite invite) {
        LocalDateTime expiresAt = invite.getExpiresAt();
        return expiresAt != null && LocalDateTime.now().isAfter(expiresAt);
    }

    private String generateCode() {
        return UUID.randomUUID().toString();
    }
}
