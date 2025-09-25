package com.college.event_hub.controller;

import com.college.event_hub.model.User;
import com.college.event_hub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    
    @Autowired
    private UserService userService;
    
    // Get all users
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(Authentication auth) {
        try {
            User admin = userService.findByUsername(auth.getName());
            if (admin == null || admin.getRole() != User.Role.ADMIN) {
                return ResponseEntity.status(403).body("Access denied. Only super admins can view all users.");
            }
            
            List<User> users = userService.findAll();
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching users: " + e.getMessage());
        }
    }
    
    // Promote student to club admin
    @PostMapping("/promote-club-admin/{userId}")
    public ResponseEntity<?> promoteToClubAdmin(@PathVariable Long userId, Authentication auth) {
        try {
            User admin = userService.findByUsername(auth.getName());
            if (admin == null || admin.getRole() != User.Role.ADMIN) {
                return ResponseEntity.status(403).body("Access denied. Only super admins can promote users.");
            }
            
            User user = userService.promoteToClubAdmin(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "User successfully promoted to Club Admin",
                "user", Map.of(
                    "id", user.getId(),
                    "username", user.getUsername(),
                    "fullName", user.getFullName(),
                    "role", user.getRole()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error promoting user: " + e.getMessage());
        }
    }
    
    // Change user role
    @PutMapping("/users/{userId}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long userId, @RequestBody Map<String, String> request, Authentication auth) {
        try {
            User admin = userService.findByUsername(auth.getName());
            if (admin == null || admin.getRole() != User.Role.ADMIN) {
                return ResponseEntity.status(403).body("Access denied. Only super admins can change user roles.");
            }
            
            User user = userService.findById(userId);
            if (user == null) {
                return ResponseEntity.notFound().build();
            }
            
            String roleStr = request.get("role");
            User.Role newRole = User.Role.valueOf(roleStr);
            user.setRole(newRole);
            
            User updatedUser = userService.updateUser(user);
            return ResponseEntity.ok(Map.of(
                "message", "User role updated successfully",
                "user", Map.of(
                    "id", updatedUser.getId(),
                    "username", updatedUser.getUsername(),
                    "fullName", updatedUser.getFullName(),
                    "role", updatedUser.getRole()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error updating user role: " + e.getMessage());
        }
    }
}