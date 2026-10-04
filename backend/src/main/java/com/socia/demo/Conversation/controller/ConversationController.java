package com.socia.demo.Conversation.controller;

import java.util.UUID;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.socia.demo.Chat.dtos.request.DirectConversationRequest;
import com.socia.demo.Chat.dtos.request.SendMessageRequest;
import com.socia.demo.Chat.dtos.response.BootstrapResponse;
import com.socia.demo.Chat.dtos.response.ConversationSummaryResponse;
import com.socia.demo.Chat.service.ChatService;
import com.socia.demo.Message.dtos.response.MessagePageResponse;
import com.socia.demo.Message.dtos.response.MessageResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ConversationController {
    private final ChatService chatService;

    @GetMapping("/bootstrap")
    public BootstrapResponse bootstrap(
            @AuthenticationPrincipal Jwt jwt) {
        return chatService.bootstrap(jwt.getSubject());
    }

    @PostMapping("/direct")
    public ConversationSummaryResponse openDirect(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody DirectConversationRequest request) {
        return chatService.openDirect(
                jwt.getSubject(),
                request.getFriendId());
    }

    @GetMapping("/{conversationId}/messages")
    public MessagePageResponse history(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @RequestParam(required = false) UUID before,
            @RequestParam(defaultValue = "30") int limit) {
        return chatService.history(
                jwt.getSubject(),
                conversationId,
                before,
                limit);
    }

    @PostMapping("/{conversationId}/messages")
    public MessageResponse send(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID conversationId,
            @Valid @RequestBody SendMessageRequest request) {
        return chatService.send(
                jwt.getSubject(),
                conversationId,
                request.getContent());
    }
}
