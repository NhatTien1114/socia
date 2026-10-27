package com.socia.demo.Presence;
import java.util.List;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import lombok.RequiredArgsConstructor;
@RestController @RequiredArgsConstructor
public class PresenceController {
    private final PresenceService presence;
    @GetMapping("/presence") public List<PresenceService.State> snapshot(@AuthenticationPrincipal Jwt jwt) {
        return presence.snapshot(jwt.getSubject());
    }
}
