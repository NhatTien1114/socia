package com.socia.demo.User.controller;

import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.converter.HttpMessageNotReadableException;
import com.socia.demo.User.dtos.request.ProfileUpdateRequest;
import com.socia.demo.User.dtos.response.ProfileResponse;
import com.socia.demo.User.service.ProfileService;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/users/me")
@RequiredArgsConstructor
public class ProfileController {
    private final ProfileService profiles;

    @GetMapping
    public ProfileResponse get() { return profiles.get(); }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ProfileResponse update(@RequestPart("profile") ProfileUpdateRequest profile,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
        return profiles.update(profile, avatar);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> invalidProfile() {
        return ResponseEntity.badRequest().body(Map.of("message", "Thông tin hoặc ngày sinh không hợp lệ."));
    }

}
