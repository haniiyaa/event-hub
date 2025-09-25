package com.college.event_hub.service;

import com.college.event_hub.model.Club;
import com.college.event_hub.repository.ClubRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ClubService {
    
    @Autowired
    private ClubRepository clubRepository;
    
    public Club createClub(Club club) {
        return clubRepository.save(club);
    }
    
    public Club findById(Long id) {
        return clubRepository.findById(id).orElse(null);
    }
    
    public Club findByAdminId(Long adminId) {
        return clubRepository.findByAdminId(adminId).orElse(null);
    }
    
    public List<Club> findAll() {
        return clubRepository.findAll();
    }
    
    public Club updateClub(Club club) {
        return clubRepository.save(club);
    }
    
    public boolean hasClub(Long adminId) {
        return clubRepository.existsByAdminId(adminId);
    }
    
    public void deleteClub(Long id) {
        clubRepository.deleteById(id);
    }
}