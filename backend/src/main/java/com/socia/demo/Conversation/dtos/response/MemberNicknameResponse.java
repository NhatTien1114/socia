package com.socia.demo.Conversation.dtos.response;

import java.util.UUID;

public record MemberNicknameResponse(UUID groupId, UUID userId, String nickname) {
}
