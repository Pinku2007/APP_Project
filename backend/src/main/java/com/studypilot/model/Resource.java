package com.studypilot.model;

public class Resource {
    private String title;
    private String channel;
    private String duration;
    private int score;
    private String url;

    public Resource() {
    }

    public Resource(String title, String channel, String duration, int score, String url) {
        this.title = title;
        this.channel = channel;
        this.duration = duration;
        this.score = score;
        this.url = url;
    }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public String getDuration() { return duration; }
    public void setDuration(String duration) { this.duration = duration; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}
