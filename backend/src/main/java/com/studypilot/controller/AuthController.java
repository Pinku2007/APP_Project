package com.studypilot.controller;

import com.studypilot.model.User;
import com.studypilot.service.AuthService;
import org.springframework.web.bind.annotation.*;

/**
 * AuthController
 * Endpoints for Register and Login.
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public User register(@RequestBody User req) {
        return authService.register(req);
    }

    @PostMapping("/login")
    public User login(@RequestBody User req) {
        return authService.login(req);
    }
}
