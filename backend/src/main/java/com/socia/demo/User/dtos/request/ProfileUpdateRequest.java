package com.socia.demo.User.dtos.request;

import java.time.LocalDate;
import com.socia.demo.Enum.Sex;

// Deliberately excludes username, password, role and avatar URL.
public record ProfileUpdateRequest(String displayName, String phone, Sex sex, LocalDate birthDate) {}
