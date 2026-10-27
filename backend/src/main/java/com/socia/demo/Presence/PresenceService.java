package com.socia.demo.Presence;

import java.time.Instant;
import java.util.*;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import com.socia.demo.Common.*;

@Service
@RequiredArgsConstructor
public class PresenceService {
    public record State(UUID userId, boolean online, Instant lastSeenAt, UUID epoch, long version) {}

    private final Common common;
    private final PresenceAudience audience;
    private final UserQueuePublisher publisher;
    private final UUID epoch = UUID.randomUUID();
    private final Map<UUID, Set<String>> sessions = new HashMap<>();
    private final Map<String, UUID> owners = new HashMap<>();
    private final Map<UUID, State> states = new HashMap<>();

    // Called under the same monitor as both session maps.
    private State transition(UUID id, boolean online) {
        State old = states.get(id);
        State next = new State(id, online, online ? (old == null ? null : old.lastSeenAt()) : Instant.now(),
            epoch, old == null ? 1 : old.version() + 1);
        states.put(id, next);
        return next;
    }

    public void connected(String session, String username) {
        UUID id = common.requireUser(username).getId();
        State changed = null;
        synchronized (this) {
            if (owners.putIfAbsent(session, id) != null) return;
            var active = sessions.computeIfAbsent(id, key -> new HashSet<>());
            active.add(session);
            if (active.size() == 1) changed = transition(id, true);
        }
        publish(changed);
    }

    public void disconnected(String session) {
        State changed = null;
        synchronized (this) {
            UUID id = owners.remove(session);
            if (id == null) return;
            var active = sessions.get(id);
            active.remove(session);
            if (active.isEmpty()) {
                sessions.remove(id);
                changed = transition(id, false);
            }
        }
        publish(changed);
    }

    private void publish(State state) {
        if (state != null) publisher.send(audience.visibleTo(state.userId()).values(), "/queue/presence", state);
    }

    public List<State> snapshot(String username) {
        var allowed = audience.visibleTo(common.requireUser(username).getId());
        synchronized (this) {
            return allowed.keySet().stream().map(id -> states.getOrDefault(id, new State(id, false, null, epoch, 0))).toList();
        }
    }
}
