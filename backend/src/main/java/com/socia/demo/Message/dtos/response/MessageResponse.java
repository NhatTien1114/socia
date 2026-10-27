package com.socia.demo.Message.dtos.response;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MessageResponse {
    @Builder.Default
    java.util.List<MessageReadResponse> reads = java.util.List.of();
    UUID id;
    UUID conversationId;
    UUID senderId;
    String content;
    LocalDateTime createdAt;
}
