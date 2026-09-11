package com.socia.demo.Message.dtos.request;

import com.socia.demo.Enum.MessageType;
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
public class MessageRequest {
    User senderId;
    String content;
    MessageType messageType;
}
