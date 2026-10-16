package com.socia.demo.Conversation.dtos.request;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class ConversationGroupRequest {
    @NotBlank(message = "Name is required")
    @Size(max = 255)
    String name;

    @Size(max = 2048)
    String avatar;

    @NotNull
    @Size(min = 2, message = "At least 2 participants are required")
    List<@NotNull UUID> participantId;
}
