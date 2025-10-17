package com.college.event_hub.service;

import com.college.event_hub.model.ClubMembership;
import com.college.event_hub.repository.ClubMembershipRepository;
import java.util.List;
import java.util.Optional;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClubMembershipService {

    private final ClubMembershipRepository membershipRepository;

    public ClubMembershipService(ClubMembershipRepository membershipRepository) {
        this.membershipRepository = membershipRepository;
    }

    public Optional<ClubMembership> findById(Long id) {
        return membershipRepository.findById(id);
    }

    public Optional<ClubMembership> findByClubAndUser(Long clubId, Long userId) {
        return membershipRepository.findByClubIdAndUserId(clubId, userId);
    }

    public List<ClubMembership> findByClub(Long clubId) {
        return membershipRepository.findByClubId(clubId);
    }

    public List<ClubMembership> findByUser(Long userId) {
        return membershipRepository.findByUserId(userId);
    }

    public boolean isMember(Long clubId, Long userId) {
        return membershipRepository.existsByClubIdAndUserId(clubId, userId);
    }

    @Transactional
    public ClubMembership save(ClubMembership membership) {
        return membershipRepository.save(membership);
    }

    @Transactional
    public void remove(Long membershipId) {
        membershipRepository.deleteById(membershipId);
    }
}
