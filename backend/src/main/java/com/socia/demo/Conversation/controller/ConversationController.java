package com.socia.demo.Conversation.controller;

import java.util.UUID;
import java.util.List;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;
import com.socia.demo.Conversation.service.ConversationService;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.socia.demo.Chat.dtos.request.DirectConversationRequest;
import com.socia.demo.Chat.dtos.request.SendMessageRequest;
import com.socia.demo.Chat.dtos.response.BootstrapResponse;
import com.socia.demo.Chat.dtos.response.ConversationSummaryResponse;
import com.socia.demo.Chat.service.ChatService;
import com.socia.demo.Conversation.dtos.request.ConversationGroupRequest;
import com.socia.demo.Conversation.dtos.response.ConversationResponse;
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
    private final ConversationService conversationService;

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

    @GetMapping("/groups")
    public List<ConversationResponse> groups(@AuthenticationPrincipal Jwt jwt) {
        return conversationService.getGroups(jwt.getSubject());
    }

    @PostMapping(value = "/groups", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse createGroupWithAvatar(@AuthenticationPrincipal Jwt jwt,
            @Valid @RequestPart("group") ConversationGroupRequest request,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {
        return conversationService.createGroup(jwt.getSubject(), request, avatar);
    }

    @PutMapping(value = "/groups/{id}/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ConversationResponse updateGroupAvatar(@AuthenticationPrincipal Jwt jwt, @PathVariable UUID id,
            @RequestPart("avatar") MultipartFile avatar) {
        return conversationService.updateAvatar(jwt.getSubject(), id, avatar);
    }

    @PostMapping(value = "/groups", consumes = MediaType.APPLICATION_JSON_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ConversationResponse createGroup(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ConversationGroupRequest request) {

        return conversationService.createGroup(jwt.getSubject(), request, null);
    }
}
