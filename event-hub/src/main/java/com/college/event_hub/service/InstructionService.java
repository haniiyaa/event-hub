package com.college.event_hub.service;

import com.college.event_hub.model.Instruction;
import com.college.event_hub.repository.InstructionRepository;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class InstructionService {
    
    @Autowired
    private InstructionRepository instructionRepository;
    
    public Instruction createInstruction(Instruction instruction) {
        return instructionRepository.save(instruction);
    }
    
    public Instruction findById(Long id) {
        return instructionRepository.findById(id).orElse(null);
    }
    
    public List<Instruction> findByEventId(Long eventId) {
        return instructionRepository.findByEventIdOrderByCreatedAtDesc(eventId);
    }
    
    public List<Instruction> findByCreatorId(Long creatorId) {
        return instructionRepository.findByCreatorId(creatorId);
    }
    
    public List<Instruction> findAll() {
        return instructionRepository.findAll();
    }
    
    public Instruction updateInstruction(Instruction instruction) {
        return instructionRepository.save(instruction);
    }
    
    public void deleteInstruction(Long id) {
        instructionRepository.deleteById(id);
    }

    public long countByEventIds(List<Long> eventIds) {
        if (eventIds == null || eventIds.isEmpty()) {
            return 0L;
        }
        return instructionRepository.countByEventIdIn(eventIds);
    }

    public List<Instruction> findRecentInstructionsForEventIds(List<Long> eventIds, int limit) {
        if (eventIds == null || eventIds.isEmpty()) {
            return Collections.emptyList();
        }
        return instructionRepository.findByEventIdInOrderByCreatedAtDesc(eventIds).stream()
            .limit(limit)
            .collect(Collectors.toList());
    }
}