package com.socia.demo.User.dtos.response;

import java.time.LocalDate;
import java.util.UUID;
import com.socia.demo.Enum.Sex;
import com.socia.demo.User.model.User;

public record ProfileResponse(UUID id, String username, String displayName, String avatar,
        String phone, Sex sex, LocalDate birthDate) {
    public static ProfileResponse from(User user) {
        return new ProfileResponse(user.getId(), user.getUsername(),
                user.getDisplayName() == null ? user.getUsername() : user.getDisplayName(),
                user.getAvatar(), user.getPhone(), user.getSex(), user.getBirthDate());
    }
}
