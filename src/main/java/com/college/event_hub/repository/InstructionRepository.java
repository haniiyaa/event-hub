package com.college.event_hub.repository;

import com.college.event_hub.model.Instruction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface InstructionRepository extends JpaRepository<Instruction, Long> {
    List<Instruction> findByEventId(Long eventId);
    List<Instruction> findByCreatorId(Long creatorId);
    List<Instruction> findByEventIdOrderByCreatedAtDesc(Long eventId);
}