package com.socia.demo.User.service;

import java.nio.charset.StandardCharsets;
import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.JWSObject;
import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.Payload;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.socia.demo.Enum.Role;
import com.socia.demo.User.dtos.request.IntrospectRequest;
import com.socia.demo.User.dtos.request.LoginRequest;
import com.socia.demo.User.dtos.request.RegisterRequest;
import com.socia.demo.User.dtos.response.AuthenticationResponse;
import com.socia.demo.User.dtos.response.IntrospectResponse;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.UserRepository;
import com.socia.demo.exception.AppException;
import com.socia.demo.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {
    private final UserRepository userRepository;

    @Value("${app.jwt.secret}")
    String jwtSecret;

    @Value("${app.jwt.issuer:socia}")
    private String jwtIssuer;

    public IntrospectResponse introspect(IntrospectRequest request) throws JOSEException, ParseException {
        boolean isValid = true;
        try {
            verify(request.getToken());
        } catch (AppException e) {
            isValid = false;
        }
        return IntrospectResponse.builder().valid(isValid).build();
    }

    public AuthenticationResponse login(LoginRequest loginRequest) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        User user = userRepository.getUserByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));
        if (passwordEncoder.matches(loginRequest.getPassword(), user.getPassword())) {
            String token = generateToken(user);
            return AuthenticationResponse.builder()
                    .message("Login successful")
                    .token(token)
                    .authenticated(true)
                    .build();
        } else {
            throw new IllegalArgumentException("Invalid username or password");
        }
    }

    public AuthenticationResponse register(RegisterRequest request) {
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);
        var user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .avatar(request.getAvatar())
                .phone(request.getPhone())
                .sex(request.getSex())
                .build();
        user.setRole(Role.USER);
        userRepository.save(user);
        return AuthenticationResponse.builder()
                .message("Registration successful")
                .build();
    }

    private String generateToken(User user) {
        JWSHeader jwsHeader = new JWSHeader(JWSAlgorithm.HS512);

        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer(jwtIssuer)
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(24, ChronoUnit.HOURS)))
                .claim("userId", user.getId().toString())
                .claim("role", user.getRole().name())
                .jwtID(UUID.randomUUID().toString())
                .build();

        JWSObject jwsObject = new JWSObject(jwsHeader, new Payload(claims.toJSONObject()));

        try {
            jwsObject.sign(new MACSigner(jwtSecret.getBytes(StandardCharsets.UTF_8)));
            return jwsObject.serialize();
        } catch (JOSEException exception) {
            log.error("Unable to generate JWT for user {}", user.getUsername(), exception);
            throw new IllegalStateException("Unable to generate authentication token", exception);
        }
    }

    private SignedJWT verify(String token) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(jwtSecret.getBytes());
        SignedJWT signedJWT = SignedJWT.parse(token);

        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        var verify = signedJWT.verify(verifier);

        if (!(verify && expiryTime.after(new Date())))
            throw new AppException(ErrorCode.UNAUTHENTICATED);

        return signedJWT;
    }
}
