package com.socia.demo.Message.dtos.request;
import java.util.*;
import jakarta.validation.constraints.*;
public record MarkMessagesReadRequest(@NotEmpty @Size(max=100) List<@NotNull UUID> messageIds) {}
