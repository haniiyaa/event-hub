package com.college.event_hub.config;

import com.college.event_hub.model.User;
import com.college.event_hub.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    @Value("${eventhub.admin.username:admin}")
    private String adminUsername;

    @Value("${eventhub.admin.password:ChangeMe123!}")
    private String adminPassword;

    @Value("${eventhub.admin.email:admin@eventhub.local}")
    private String adminEmail;

    @Value("${eventhub.admin.full-name:Event Hub Administrator}")
    private String adminFullName;

    @Bean
    public CommandLineRunner ensureAdminUser(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            userRepository.findByUsername(adminUsername).ifPresentOrElse(
                user -> {
                    if (user.getRole() != User.Role.ADMIN) {
                        user.setRole(User.Role.ADMIN);
                        userRepository.save(user);
                        logger.info("Existing user '{}' promoted to ADMIN role during startup.", adminUsername);
                    }
                },
                () -> {
                    User admin = new User();
                    admin.setUsername(adminUsername);
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    admin.setEmail(adminEmail);
                    admin.setFullName(adminFullName);
                    admin.setPhoneNumber("N/A");
                    admin.setClassDetails("Administrator");
                    admin.setRole(User.Role.ADMIN);
                    userRepository.save(admin);
                    logger.info("Default admin user '{}' created. Please update the password after first login.", adminUsername);
                }
            );
        };
    }
}
