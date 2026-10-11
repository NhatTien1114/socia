package com.socia.demo.config;

import java.time.Duration;
import java.time.Instant;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class AuthCookies {
    public static final String NAME = "socia_access_token";
    private final boolean secure;
    private final String path;

    public AuthCookies(
            @Value("${app.auth.cookie-secure:false}") boolean secure,
            @Value("${server.servlet.context-path:/socia/v1}") String path) {
        this.secure = secure;
        this.path = path.isBlank() ? "/" : path;
    }

    public String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();

        if (cookies == null)
            return null;
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName()))
                return cookie.getValue();
        }

        return null;
    }

    public void write(HttpServletResponse response, String token, Instant expiresAt) {
        long seconds = Math.max(0, Duration.between(Instant.now(), expiresAt).getSeconds());
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(token).maxAge(seconds).build().toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("").maxAge(0).build().toString());
    }

    private ResponseCookie.ResponseCookieBuilder cookie(String value) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true).secure(secure).sameSite("Lax").path(path);
    }
}
