package com.college.event_hub.dto;

import com.college.event_hub.model.Club;
import com.college.event_hub.model.ClubMembership;

public class ClubBrowseResponse {

    private Long id;
    private String name;
    private String description;
    private Club.Status status;
    private boolean member;
    private ClubMembership.Role membershipRole;
    private boolean pendingRequest;

    public static ClubBrowseResponse from(Club club, ClubMembership membership, boolean pendingRequest) {
        ClubBrowseResponse response = new ClubBrowseResponse();
        response.setId(club.getId());
        response.setName(club.getName());
        response.setDescription(club.getDescription());
        response.setStatus(club.getStatus());
        response.setMember(membership != null);
        response.setMembershipRole(membership != null ? membership.getRole() : null);
        response.setPendingRequest(pendingRequest);
        return response;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Club.Status getStatus() {
        return status;
    }

    public void setStatus(Club.Status status) {
        this.status = status;
    }

    public boolean isMember() {
        return member;
    }

    public void setMember(boolean member) {
        this.member = member;
    }

    public ClubMembership.Role getMembershipRole() {
        return membershipRole;
    }

    public void setMembershipRole(ClubMembership.Role membershipRole) {
        this.membershipRole = membershipRole;
    }

    public boolean isPendingRequest() {
        return pendingRequest;
    }

    public void setPendingRequest(boolean pendingRequest) {
        this.pendingRequest = pendingRequest;
    }
}
