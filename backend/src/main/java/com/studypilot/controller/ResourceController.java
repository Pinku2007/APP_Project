package com.studypilot.controller;

import com.studypilot.model.Resource;
import com.studypilot.service.ResourceService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * ResourceController
 * Endpoint: GET /api/resources?topic=...&subject=...
 * Delivers ranked YouTube tutorials and study notes for any topic.
 */
@RestController
@RequestMapping("/api/resources")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class ResourceController {

    private final ResourceService resourceService;

    public ResourceController(ResourceService resourceService) {
        this.resourceService = resourceService;
    }

    @GetMapping
    public List<Resource> getResources(
            @RequestParam("topic") String topic,
            @RequestParam(value = "subject", required = false, defaultValue = "") String subject) {
        return resourceService.getBestResources(topic, subject);
    }
}
