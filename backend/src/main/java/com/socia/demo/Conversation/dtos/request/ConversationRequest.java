package com.socia.demo.Conversation.dtos.request;

import com.socia.demo.Enum.ConversationType;

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
public class ConversationRequest {
    ConversationType conversationType;
    String name;
    String avatar;
    String createdPersonId;
}
