package com.socia.demo.Conversation.dtos.response;

import java.time.LocalDateTime;
import java.util.UUID;

import com.socia.demo.Enum.ConversationType;
import com.socia.demo.User.model.User;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
@FieldDefaults(level = lombok.AccessLevel.PRIVATE)
public class ConversationResponse {
    UUID id;
    ConversationType conversationType;
    String name;
    String avatar;
    User createdPerson;
    LocalDateTime createdAt;
}
