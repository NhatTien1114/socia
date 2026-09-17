package com.socia.demo.config;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;

import com.socia.demo.exception.ApiResponse;
import com.socia.demo.exception.ErrorCode;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final ObjectMapper objectMapper;

    @Autowired
    private CustomJwtDecoder customJwtDecoder;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/**").permitAll());
        http.exceptionHandling(
                exception -> exception
                        .accessDeniedHandler(accessDeniedHandler())
                        .authenticationEntryPoint(authenticationEntryPoint()));
        http.oauth2ResourceServer(
                oauth2 -> oauth2.jwt(
                        jwtConfigurer -> jwtConfigurer.decoder(customJwtDecoder)));
        return http.build();
    }

    @Bean
    AccessDeniedHandler accessDeniedHandler() {
        return (request, response, exception) -> writeErrorResponse(response, ErrorCode.UNAUTHORIZED, 403);
    }

    @Bean
    AuthenticationEntryPoint authenticationEntryPoint() {
        return (request, response, exception) -> writeErrorResponse(response, ErrorCode.UNAUTHENTICATED, 401);
    }

    private void writeErrorResponse(HttpServletResponse response, ErrorCode error, int status)
            throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(
                response.getOutputStream(),
                ApiResponse.builder().code(error.getCode()).message(error.getMessage()).build());
    }
}
