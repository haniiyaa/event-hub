package com.college.event_hub.repository;

import com.college.event_hub.model.Instruction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstructionRepository extends JpaRepository<Instruction, Long> {
    List<Instruction> findByEventId(Long eventId);
    List<Instruction> findByCreatorId(Long creatorId);
    List<Instruction> findByEventIdOrderByCreatedAtDesc(Long eventId);
    List<Instruction> findByEventIdInOrderByCreatedAtDesc(List<Long> eventIds);
    long countByEventIdIn(List<Long> eventIds);
}