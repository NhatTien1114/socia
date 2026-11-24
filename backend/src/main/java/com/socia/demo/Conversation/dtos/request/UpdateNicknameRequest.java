package com.socia.demo.Conversation.dtos.request;

import jakarta.validation.constraints.NotNull;

public record UpdateNicknameRequest(@NotNull String nickname) {
}
