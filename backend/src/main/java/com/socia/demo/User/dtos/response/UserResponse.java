package com.socia.demo.User.dtos.response;

import java.util.UUID;

import com.socia.demo.Enum.Role;
import com.socia.demo.Enum.Sex;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class UserResponse {
    UUID id;
    String username;
    String avatar;
    String phone;
    Sex sex;
    boolean isActive;
    Role role;
}
