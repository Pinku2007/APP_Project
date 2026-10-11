package com.studypilot.controller;

import com.studypilot.model.Session;
import com.studypilot.service.PlanService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * PlanController
 * Endpoints for generating the study plan, getting sessions, and marking today's work done.
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class PlanController {

    private final PlanService planService;

    public PlanController(PlanService planService) {
        this.planService = planService;
    }

    @PostMapping("/plans/generate")
    public Map<String, Object> generatePlan(@RequestBody Map<String, Object> body) {
        int dailyMinutes = ((Number) body.get("dailyMinutes")).intValue();
        List<Session> sessions = planService.generatePlan(dailyMinutes);

        Map<String, Object> response = new HashMap<>();
        response.put("sessions", sessions);
        return response;
    }

    @GetMapping("/sessions")
    public List<Session> getSessions() {
        return planService.getAllSessions();
    }

    @PostMapping("/sessions/{id}/complete")
    public List<Session> completeSession(@PathVariable String id) {
        return planService.completeSession(id);
    }
}
