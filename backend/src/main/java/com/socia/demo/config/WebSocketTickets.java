package com.socia.demo.config;

import java.security.SecureRandom;
import java.time.Clock;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

/** Short-lived, single-use credentials scoped exclusively to the WebSocket handshake. */
@Component
public class WebSocketTickets {
    public static final String PREFIX = "socia-ticket.";
    private record Entry(Jwt jwt, Instant expiresAt) {}
    private final Map<String, Entry> tickets = new HashMap<>();
    private final SecureRandom random = new SecureRandom();
    private final Clock clock;

    public WebSocketTickets() { this(Clock.systemUTC()); }
    WebSocketTickets(Clock clock) { this.clock = clock; }

    public synchronized String issue(Jwt jwt) {
        Instant now = clock.instant();
        tickets.values().removeIf(e -> !e.expiresAt().isAfter(now));
        if (jwt.getExpiresAt() == null || !jwt.getExpiresAt().isAfter(now))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        if (tickets.size() >= 1000 || tickets.values().stream()
                .filter(e -> e.jwt().getSubject().equals(jwt.getSubject())).count() >= 5)
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS);
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String ticket = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant expiry = now.plusSeconds(30);
        if (jwt.getExpiresAt().isBefore(expiry)) expiry = jwt.getExpiresAt();
        tickets.put(ticket, new Entry(jwt, expiry));
        return ticket;
    }

    public synchronized Jwt consume(String ticket) {
        Entry entry = tickets.remove(ticket);
        return entry != null && entry.expiresAt().isAfter(clock.instant()) ? entry.jwt() : null;
    }
}
