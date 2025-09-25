package com.college.event_hub.service;

import com.college.event_hub.model.Instruction;
import com.college.event_hub.repository.InstructionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

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
}