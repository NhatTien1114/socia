package com.socia.demo.config;

import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import jakarta.servlet.http.HttpServletResponse;

@RestController
public class WebSocketTicketController {
    private final WebSocketTickets tickets;
    private final String url;

    public WebSocketTicketController(WebSocketTickets tickets,
            @Value("${WS_PUBLIC_BASE_URL:${RENDER_EXTERNAL_URL:}}") String base,
            @Value("${server.servlet.context-path:/socia/v1}") String contextPath) {
        this.tickets = tickets;
        this.url = base.replaceAll("/+$", "") + contextPath + "/ws";
    }

    @PostMapping("/auth/ws-ticket")
    public Map<String, String> issue(@AuthenticationPrincipal Jwt jwt, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        return Map.of("ticket", tickets.issue(jwt), "url", url);
    }
}
