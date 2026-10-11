package com.studypilot.service;

import com.studypilot.model.Resource;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Service
public class ResourceService {

    // Returns best YouTube tutorials and study links for a topic
    public List<Resource> getBestResources(String topic, String subject) {
        String cleanTopic = (topic != null && !topic.isBlank()) ? topic.trim() : "Programming";
        String cleanSubject = (subject != null && !subject.isBlank()) ? subject.trim() : "";

        List<Resource> list = new ArrayList<>();

        // Gate Smashers / Neso Academy
        int score1 = calculateScore(98, 95, 92, 88, 95, 90);
        list.add(new Resource(
                cleanTopic + " - Complete University Lecture",
                "Gate Smashers / Neso Academy",
                "18 min video",
                score1,
                buildYouTubeUrl(cleanTopic + " " + cleanSubject + " Gate Smashers Neso Academy")
        ));

        // Abdul Bari / Jenny's Lectures
        int score2 = calculateScore(95, 94, 90, 85, 88, 92);
        list.add(new Resource(
                cleanTopic + " Explained with Examples",
                "Abdul Bari / Jenny's Lectures",
                "25 min video",
                score2,
                buildYouTubeUrl(cleanTopic + " " + cleanSubject + " Abdul Bari Jenny's Lectures")
        ));

        // Telusko / Apna College
        int score3 = calculateScore(90, 90, 94, 92, 85, 88);
        list.add(new Resource(
                cleanTopic + " - Practical Tutorial & Code",
                "Telusko / Apna College",
                "20 min video",
                score3,
                buildYouTubeUrl(cleanTopic + " " + cleanSubject + " Telusko Apna College")
        ));

        // GeeksforGeeks Notes
        int score4 = calculateScore(92, 88, 85, 90, 90, 95);
        list.add(new Resource(
                cleanTopic + " - Quick Revision Notes",
                "GeeksforGeeks Articles",
                "10 min read",
                score4,
                buildGoogleUrl(cleanTopic + " " + cleanSubject + " geeksforgeeks")
        ));

        // Sort by highest score first
        list.sort((a, b) -> Integer.compare(b.getScore(), a.getScore()));
        return list;
    }

    // Calculates quality score based on relevance, channel, and duration
    private int calculateScore(int topicRel, int channelQual, int views, int freshness, int durationFit, int metadata) {
        double weighted = (0.40 * topicRel)
                + (0.20 * channelQual)
                + (0.15 * views)
                + (0.10 * freshness)
                + (0.10 * durationFit)
                + (0.05 * metadata);
        return (int) Math.round(weighted);
    }

    private String buildYouTubeUrl(String query) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        return "https://www.youtube.com/results?search_query=" + encoded;
    }

    private String buildGoogleUrl(String query) {
        String encoded = URLEncoder.encode(query, StandardCharsets.UTF_8);
        return "https://www.google.com/search?q=" + encoded;
    }
}
