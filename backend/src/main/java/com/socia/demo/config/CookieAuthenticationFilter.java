package com.socia.demo.config;

import java.io.IOException;
import java.util.List;
import java.util.Set;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class CookieAuthenticationFilter extends OncePerRequestFilter {
    private static final Set<String> PUBLIC_PATHS = Set.of(
            "/auth/login", "/auth/register", "/auth/csrf", "/auth/logout", "/error");
    private final CustomJwtDecoder decoder;
    private final AuthCookies cookies;
    private final WebSocketTickets tickets;
    private final String origin;

    public CookieAuthenticationFilter(CustomJwtDecoder decoder, AuthCookies cookies,
            WebSocketTickets tickets, String origin) {
        this.decoder = decoder;
        this.cookies = cookies;
        this.tickets = tickets;
        this.origin = origin;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return PUBLIC_PATHS.contains(path) || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        String protocols = request.getHeader("Sec-WebSocket-Protocol");
        if ("/ws".equals(path) && "GET".equals(request.getMethod())
                && "websocket".equalsIgnoreCase(request.getHeader("Upgrade"))
                && protocols != null && protocols.contains(WebSocketTickets.PREFIX)) {
            var jwt = origin.equals(request.getHeader("Origin"))
                    ? java.util.Arrays.stream(protocols.split(","))
                            .map(String::trim).filter(p -> p.startsWith(WebSocketTickets.PREFIX))
                            .findFirst().map(p -> tickets.consume(p.substring(WebSocketTickets.PREFIX.length())))
                            .orElse(null)
                    : null;
            if (jwt == null) {
                response.setStatus(401);
                return;
            }
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(new JwtAuthenticationToken(jwt, List.of()));
            SecurityContextHolder.setContext(context);
            chain.doFilter(request, response);
            return;
        }
        String token = cookies.read(request);
        if (token != null && !token.isBlank()) {
            try {
                var jwt = decoder.decode(token);
                var context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(new JwtAuthenticationToken(jwt, List.of()));
                SecurityContextHolder.setContext(context);
            } catch (JwtException | IllegalArgumentException exception) {
                SecurityContextHolder.clearContext();
                cookies.clear(response);
                response.setStatus(401);
                response.setContentType("application/json");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write(
                        "{\"code\":\"UNAUTHENTICATED\",\"message\":\"Phiên đăng nhập đã hết hạn hoặc không hợp lệ.\"}");
                return;
            }
        }
        chain.doFilter(request, response);
    }

}
