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

    public CookieAuthenticationFilter(CustomJwtDecoder decoder, AuthCookies cookies) {
        this.decoder = decoder;
        this.cookies = cookies;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI().substring(request.getContextPath().length());
        return PUBLIC_PATHS.contains(path) || "OPTIONS".equals(request.getMethod());
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
            FilterChain chain) throws ServletException, IOException {
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
