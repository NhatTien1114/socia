package com.socia.demo.User.dtos.request;

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
public class RegisterRequest {
    String username;
    String password;
    String avatar;
    String phone;
    Sex sex;
}
