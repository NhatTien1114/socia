package com.socia.demo.config;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfException;
import org.springframework.security.web.csrf.CsrfFilter;
import org.springframework.security.web.csrf.XorCsrfTokenRequestAttributeHandler;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import tools.jackson.databind.ObjectMapper;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    @Bean
    CookieCsrfTokenRepository csrfTokenRepository(
            @Value("${app.auth.cookie-secure:false}") boolean secure,
            @Value("${server.servlet.context-path:/socia/v1}") String path) {
        var repository = new CookieCsrfTokenRepository();
        repository.setCookieCustomizer(cookie -> cookie
                .httpOnly(true).secure(secure).sameSite("Lax").path(path.isBlank() ? "/" : path));
        return repository;
    }

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http, CustomJwtDecoder decoder,
            AuthCookies cookies, CookieCsrfTokenRepository csrfRepository,
            ObjectMapper json,
            @Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource) throws Exception {
        AccessDeniedHandler denied = (request, response, exception) -> {
            response.setStatus(403);
            response.setContentType("application/json");
            json.writeValue(response.getOutputStream(), Map.of(
                    "code", exception instanceof CsrfException ? "CSRF_INVALID" : "FORBIDDEN",
                    "message", exception instanceof CsrfException
                            ? "Mã bảo vệ yêu cầu không hợp lệ. Vui lòng thử lại."
                            : "Bạn không có quyền thực hiện thao tác này."));
        };

        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(new XorCsrfTokenRequestAttributeHandler())
                        .requireCsrfProtectionMatcher(CsrfFilter.DEFAULT_CSRF_MATCHER))
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .requestCache(cache -> cache.disable())
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                .logout(logout -> logout.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/auth/login", "/auth/register", "/auth/csrf",
                                "/auth/logout", "/error")
                        .permitAll()
                        .anyRequest().authenticated())
                .exceptionHandling(errors -> errors
                        .accessDeniedHandler(denied)
                        .authenticationEntryPoint((request, response, exception) -> {
                            cookies.clear(response);
                            response.setStatus(401);
                            response.setContentType("application/json");
                            json.writeValue(response.getOutputStream(), Map.of(
                                    "code", "UNAUTHENTICATED", "message", "Vui lòng đăng nhập lại."));
                        }))
                .addFilterBefore(new CookieAuthenticationFilter(decoder, cookies),
                        UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource(
            @Value("${app.frontend-origin:http://localhost:5173}") String origin) {
        var config = new CorsConfiguration();
        config.setAllowedOrigins(List.of(origin));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Content-Type", "X-XSRF-TOKEN"));
        config.setAllowCredentials(true);
        var source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
