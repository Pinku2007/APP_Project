package com.studypilot.service;

import com.studypilot.model.User;
import com.studypilot.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

/**
 * AuthService
 * Handles student registration and login with input validation,
 * case-insensitive email normalization, and helpful error messages.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;

    public AuthService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User register(User req) {
        if (req == null) {
            throw new IllegalArgumentException("Invalid registration request.");
        }
        String name = req.getName() != null ? req.getName().trim() : "";
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : "";
        String password = req.getPassword() != null ? req.getPassword().trim() : "";

        if (name.isEmpty()) {
            throw new IllegalArgumentException("Please enter your name.");
        }
        if (email.isEmpty()) {
            throw new IllegalArgumentException("Please enter your email.");
        }
        if (!email.contains("@") || !email.contains(".")) {
            throw new IllegalArgumentException("Please enter a valid email address.");
        }
        if (password.length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("An account with email '" + email + "' already exists. Please log in instead.");
        }

        User newUser = new User(name, email, password);
        return userRepository.save(newUser);
    }

    public User login(User req) {
        if (req == null) {
            throw new IllegalArgumentException("Invalid login request.");
        }
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase() : "";
        String password = req.getPassword() != null ? req.getPassword().trim() : "";

        if (email.isEmpty()) {
            throw new IllegalArgumentException("Please enter your email.");
        }
        if (password.isEmpty()) {
            throw new IllegalArgumentException("Please enter your password.");
        }

        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("No account found for '" + email + "'. Please check spelling, create an account, or use Demo Login.");
        }

        User user = userOpt.get();
        if (!user.getPassword().equals(password)) {
            throw new IllegalArgumentException("Incorrect password for " + email + ". Please try again.");
        }
        return user;
    }
}
