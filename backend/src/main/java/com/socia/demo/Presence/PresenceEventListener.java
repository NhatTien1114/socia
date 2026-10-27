package com.socia.demo.Presence;
import java.time.Instant;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.socket.messaging.*;
import lombok.RequiredArgsConstructor;
@Component @RequiredArgsConstructor
public class PresenceEventListener {
    private final PresenceService presence;
    @EventListener public void connected(SessionConnectedEvent event) {
        if (event.getUser() instanceof JwtAuthenticationToken auth && auth.isAuthenticated()
                && auth.getToken().getExpiresAt() != null && auth.getToken().getExpiresAt().isAfter(Instant.now())) {
            String session = StompHeaderAccessor.wrap(event.getMessage()).getSessionId();
            if (session != null) presence.connected(session, auth.getName());
        }
    }
    @EventListener public void disconnected(SessionDisconnectEvent event) { presence.disconnected(event.getSessionId()); }
}
