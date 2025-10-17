package com.college.event_hub.service;

import com.college.event_hub.model.Club;
import com.college.event_hub.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.EnumSet;
import java.util.List;

@Service
public class ClubService {
    
    @Autowired
    private ClubRepository clubRepository;
    
    public Club createClub(Club club) {
        if (club.getStatus() == null) {
            club.setStatus(Club.Status.ACTIVE);
        }
        return clubRepository.save(club);
    }
    
    public Club findById(Long id) {
        return clubRepository.findById(id).orElse(null);
    }
    
    public Club findByAdminId(Long adminId) {
        return clubRepository
            .findFirstByAdminIdAndStatusIn(adminId, EnumSet.of(Club.Status.PENDING, Club.Status.ACTIVE))
            .orElse(null);
    }
    
    public List<Club> findAll() {
        return clubRepository.findAll();
    }

    public List<Club> findByStatuses(Collection<Club.Status> statuses) {
        if (statuses == null || statuses.isEmpty()) {
            return clubRepository.findAll();
        }
        return clubRepository.findByStatusIn(statuses);
    }

    public List<Club> findByStatus(Club.Status status) {
        if (status == null) {
            return clubRepository.findAll();
        }
        return clubRepository.findByStatus(status);
    }
    
    public Club updateClub(Club club) {
        return clubRepository.save(club);
    }
    
    public boolean hasClub(Long adminId) {
        return clubRepository
            .findFirstByAdminIdAndStatusIn(adminId, EnumSet.of(Club.Status.PENDING, Club.Status.ACTIVE))
            .isPresent();
    }

    public boolean hasActiveClub(Long adminId) {
        return clubRepository.existsByAdminIdAndStatus(adminId, Club.Status.ACTIVE);
    }
    
    public void deleteClub(Long id) {
        clubRepository.deleteById(id);
    }
}