package com.college.event_hub.controller;

import com.college.event_hub.model.User;
import com.college.event_hub.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @Autowired
    private UserService userService;
    
    @Autowired
    private AuthenticationManager authenticationManager;
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            String email = request.get("email");
            String fullName = request.get("fullName");
            
            if (userService.existsByUsername(username)) {
                return ResponseEntity.badRequest().body("Username already exists!");
            }
            
            if (userService.existsByEmail(email)) {
                return ResponseEntity.badRequest().body("Email already exists!");
            }
            
            User user = new User(username, password, email, fullName);
            User savedUser = userService.createUser(user);
            
            return ResponseEntity.ok("User registered successfully! Username: " + savedUser.getUsername());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error registering user: " + e.getMessage());
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> request) {
        try {
            String username = request.get("username");
            String password = request.get("password");
            
            Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
            
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            User user = userService.findByUsername(username);
            return ResponseEntity.ok(Map.of(
                "message", "Login successful",
                "username", user.getUsername(),
                "role", user.getRole(),
                "fullName", user.getFullName()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
    }
    
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body("Not authenticated");
        }
        
        User user = userService.findByUsername(auth.getName());
        if (user == null) {
            return ResponseEntity.status(404).body("User not found");
        }
        
        return ResponseEntity.ok(Map.of(
            "id", user.getId(),
            "username", user.getUsername(),
            "email", user.getEmail(),
            "fullName", user.getFullName(),
            "role", user.getRole()
        ));
    }
}