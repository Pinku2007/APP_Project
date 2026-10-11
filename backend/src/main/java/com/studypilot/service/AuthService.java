package com.studypilot.service;

import com.studypilot.model.User;
import com.studypilot.repository.UserRepository;
import org.springframework.stereotype.Service;

/**
 * AuthService
 * Simple service for student registration and login.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(User req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        User newUser = new User(req.getName(), req.getEmail(), req.getPassword());
        return userRepository.save(newUser);
    }

    public User login(User req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));

        if (!user.getPassword().equals(req.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password.");
        }
        return user;
    }
}
