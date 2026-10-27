package com.socia.demo.Message.dtos.response;
import java.time.Instant;
import java.util.UUID;
public record MessageReadResponse(UUID messageId, UUID readerId, Instant readAt) {}
