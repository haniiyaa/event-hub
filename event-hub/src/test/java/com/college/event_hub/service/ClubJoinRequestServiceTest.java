package com.college.event_hub.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.ClubJoinRequest;
import com.college.event_hub.model.ClubJoinRequest.RequestType;
import com.college.event_hub.model.ClubMembership;
import com.college.event_hub.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@Transactional
class ClubJoinRequestServiceTest {

    @Autowired
    private ClubJoinRequestService joinRequestService;

    @Autowired
    private ClubMembershipService membershipService;

    @Autowired
    private UserService userService;

    @Autowired
    private ClubService clubService;

    private User clubAdmin;
    private Club club;

    @BeforeEach
    void setUp() {
        clubAdmin = new User("clubadmin", "password", "clubadmin@example.com", "Club Admin");
        clubAdmin.setRole(User.Role.CLUB_ADMIN);
        clubAdmin = userService.createUser(clubAdmin);
        clubAdmin.setRole(User.Role.CLUB_ADMIN);
        clubAdmin = userService.updateUser(clubAdmin);

        club = new Club();
        club.setName("Robotics Club");
        club.setDescription("Robotics enthusiasts");
        club.setAdmin(clubAdmin);
        club = clubService.createClub(club);
    }

    @Test
    void createRequest_preventsDuplicateJoinRequests() {
        User student = new User("student1", "password", "student1@example.com", "Student One");
        student = userService.createUser(student);

        ClubJoinRequest first = new ClubJoinRequest();
        first.setRequester(student);
        first.setTargetClub(club);
        first.setType(RequestType.JOIN_CLUB);
        joinRequestService.createRequest(first);

        ClubJoinRequest duplicate = new ClubJoinRequest();
        duplicate.setRequester(student);
        duplicate.setTargetClub(club);
        duplicate.setType(RequestType.JOIN_CLUB);

        assertThrows(IllegalStateException.class, () -> joinRequestService.createRequest(duplicate));
    }

    @Test
    void approveRequest_createsMembershipForStudent() {
        User student = new User("student2", "password", "student2@example.com", "Student Two");
        student = userService.createUser(student);

        ClubJoinRequest request = new ClubJoinRequest();
        request.setRequester(student);
        request.setTargetClub(club);
        request.setType(RequestType.JOIN_CLUB);
        ClubJoinRequest saved = joinRequestService.createRequest(request);

        ClubJoinRequest approved = joinRequestService.approveRequest(saved.getId(), clubAdmin);
        assertThat(approved.getStatus()).isEqualTo(ClubJoinRequest.Status.APPROVED);
        assertThat(membershipService.isMember(club.getId(), student.getId())).isTrue();

        ClubMembership membership = membershipService.findByClubAndUser(club.getId(), student.getId()).orElse(null);
        assertThat(membership).isNotNull();
        assertThat(membership.getRole()).isEqualTo(ClubMembership.Role.MEMBER);
    }

    @Test
    void approveClubCreationRequest_activatesClubAndAssignsOfficerRole() {
        User requester = new User("student3", "password", "student3@example.com", "Student Three");
        requester = userService.createUser(requester);

        ClubJoinRequest creationRequest = new ClubJoinRequest();
        creationRequest.setRequester(requester);
        creationRequest.setType(RequestType.CREATE_CLUB);
        creationRequest.setRequestedName("Innovation Hub");
        creationRequest.setRequestedDescription("Exploring new ideas");
        ClubJoinRequest savedRequest = joinRequestService.createRequest(creationRequest);

        User superAdmin = new User("adminUser", "password", "adminUser@example.com", "Super Admin");
        superAdmin = userService.createUser(superAdmin);
        superAdmin.setRole(User.Role.ADMIN);
        superAdmin = userService.updateUser(superAdmin);

        User promotedRequester = userService.promoteToClubAdmin(requester.getId());
        Club pendingClub = new Club();
        pendingClub.setName("Innovation Hub");
        pendingClub.setDescription("Exploring new ideas");
        pendingClub.setAdmin(promotedRequester);
        pendingClub.setStatus(Club.Status.PENDING);
        Club createdClub = clubService.createClub(pendingClub);

        ClubJoinRequest approved = joinRequestService.approveClubCreationRequest(savedRequest.getId(), superAdmin, createdClub);

        assertThat(approved.getStatus()).isEqualTo(ClubJoinRequest.Status.APPROVED);
        assertThat(approved.getTargetClub()).isNotNull();
        assertThat(approved.getTargetClub().getStatus()).isEqualTo(Club.Status.ACTIVE);

        ClubMembership officerMembership = membershipService
            .findByClubAndUser(createdClub.getId(), promotedRequester.getId())
            .orElse(null);

        assertThat(officerMembership).isNotNull();
        assertThat(officerMembership.getRole()).isEqualTo(ClubMembership.Role.OFFICER);
    }
}
