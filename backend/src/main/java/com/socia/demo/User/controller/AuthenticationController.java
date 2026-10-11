package com.socia.demo.User.controller;

import java.time.Instant;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.socia.demo.User.dtos.request.LoginRequest;
import com.socia.demo.User.dtos.request.RegisterRequest;
import com.socia.demo.User.service.AuthenticationService;
import com.socia.demo.config.AuthCookies;
import com.socia.demo.config.CustomJwtDecoder;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService service;
    AuthCookies cookies;
    CustomJwtDecoder decoder;
    CookieCsrfTokenRepository csrf;

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken token, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        return Map.of("headerName", token.getHeaderName(), "token", token.getToken());
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request,
            HttpServletRequest httpRequest, HttpServletResponse response) {
        if (request.getUsername() == null || request.getPassword() == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập tài khoản và mật khẩu."));
        }
        String token;
        try {
            token = service.login(request).getToken();
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.status(401).body(Map.of("message", "Tài khoản hoặc mật khẩu không đúng."));
        }
        Jwt jwt = decoder.decode(token);
        cookies.write(response, token, jwt.getExpiresAt());
        csrf.saveToken(null, httpRequest, response);
        response.setHeader("Cache-Control", "no-store");
        return ResponseEntity.ok(Map.of(
                "authenticated", true,
                "message", "Đăng nhập thành công.",
                "expiresAt", jwt.getExpiresAt().toString(),
                "serverTime", Instant.now().toString()));
    }

    @GetMapping("/session")
    public Map<String, Object> session(@AuthenticationPrincipal Jwt jwt, HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-store");
        return Map.of("authenticated", true, "username", jwt.getSubject(),
                "expiresAt", jwt.getExpiresAt().toString(), "serverTime", Instant.now().toString());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        cookies.clear(response);
        csrf.saveToken(null, request, response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody RegisterRequest request) {
        service.register(request);
        return Map.of("message", "Đăng ký thành công.");
    }
}
