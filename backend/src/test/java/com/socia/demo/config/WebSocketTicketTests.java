package com.socia.demo.config;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.time.*;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

class WebSocketTicketTests {
    private Jwt jwt(Instant now) {
        return Jwt.withTokenValue("private-jwt").header("alg", "HS512")
                .subject("alice").issuedAt(now).expiresAt(now.plusSeconds(300)).build();
    }

    @Test void ticketsExpireAndCanOnlyBeUsedOnce() {
        Instant now = Instant.now();
        Clock clock = mock(Clock.class);
        when(clock.instant()).thenReturn(now);
        var tickets = new WebSocketTickets(clock);
        String first = tickets.issue(jwt(now));
        assertThat(first).matches("[A-Za-z0-9_-]{43}");
        assertThat(tickets.consume(first).getSubject()).isEqualTo("alice");
        assertThat(tickets.consume(first)).isNull();
        String expired = tickets.issue(jwt(now));
        when(clock.instant()).thenReturn(now.plusSeconds(30));
        assertThat(tickets.consume(expired)).isNull();
    }

    @Test void ticketIsRestrictedToHandshakeAndExpectedOrigin() throws Exception {
        var tickets = new WebSocketTickets();
        var filter = new CookieAuthenticationFilter(mock(CustomJwtDecoder.class),
                new AuthCookies(true, "/socia/v1"), tickets, "https://frontend.example");
        String ticket = tickets.issue(jwt(Instant.now()));
        for (String path : List.of("/auth/session", "/ws")) {
            var request = new MockHttpServletRequest("GET", "/socia/v1" + path);
            request.setContextPath("/socia/v1");
            request.addHeader("Upgrade", "websocket");
            request.addHeader("Sec-WebSocket-Protocol", "v12.stomp, socia-ticket." + ticket);
            request.addHeader("Origin", "https://evil.example");
            var response = new MockHttpServletResponse();
            try {
                filter.doFilter(request, response, (req, res) ->
                    assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull());
                if (path.equals("/ws")) assertThat(response.getStatus()).isEqualTo(401);
            } finally { SecurityContextHolder.clearContext(); }
        }
        var request = new MockHttpServletRequest("GET", "/socia/v1/ws");
        request.setContextPath("/socia/v1");
        request.addHeader("Upgrade", "websocket");
        request.addHeader("Sec-WebSocket-Protocol", "v12.stomp, socia-ticket." + ticket);
        request.addHeader("Origin", "https://frontend.example");
        try {
            filter.doFilter(request, new MockHttpServletResponse(), (req, res) ->
                assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo("alice"));
        } finally { SecurityContextHolder.clearContext(); }
        assertThat(tickets.consume(ticket)).isNull();
    }
}
