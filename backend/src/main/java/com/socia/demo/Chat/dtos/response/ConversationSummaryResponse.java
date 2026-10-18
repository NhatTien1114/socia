package com.socia.demo.Chat.dtos.response;

import java.util.UUID;
import java.util.List;
import com.socia.demo.Enum.ConversationType;

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
public class ConversationSummaryResponse {
    UUID id;
    UserSummaryResponse friend;
    ConversationType conversationType;
    String name;
    String avatar;
    List<UserSummaryResponse> participants;
}
