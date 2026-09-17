package com.socia.demo.User.controller;

import java.text.ParseException;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.nimbusds.jose.JOSEException;
import com.socia.demo.User.dtos.request.IntrospectRequest;
import com.socia.demo.User.dtos.request.LoginRequest;
import com.socia.demo.User.dtos.request.RegisterRequest;
import com.socia.demo.User.dtos.response.AuthenticationResponse;
import com.socia.demo.User.dtos.response.IntrospectResponse;
import com.socia.demo.User.service.AuthenticationService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/auth")
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/introspect")
    public ResponseEntity<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws JOSEException, ParseException {
        IntrospectResponse response = authenticationService.introspect(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> login(@RequestBody LoginRequest loginRequest) {
        AuthenticationResponse response = authenticationService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        AuthenticationResponse response = authenticationService.register(request);
        return ResponseEntity.ok(response);
    }
}
