package com.socia.demo.User.dtos.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.socia.demo.Enum.FriendRequestStatus;

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
public class FriendResponse {
    UUID id;
    String sender;
    String receiver;
    @Builder.Default
    FriendRequestStatus status = FriendRequestStatus.PENDING;
    LocalDateTime createdAt;
    LocalDateTime respondedAt;
}
