package com.socia.demo.Conversation.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.socia.demo.Conversation.dtos.request.ConversationRequest;
import com.socia.demo.Conversation.dtos.response.ConversationResponse;
import com.socia.demo.Conversation.service.ConversationService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/conversations")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ConversationController {
    ConversationService conversationService;

    @PostMapping
    public ResponseEntity<ConversationResponse> createConversation(@RequestBody ConversationRequest request) {
        ConversationResponse response = conversationService.createConversation(request);
        return ResponseEntity.ok().body(response);
    }

    @GetMapping
    public ResponseEntity<List<ConversationResponse>> getAllConversations() {
        List<ConversationResponse> responses = conversationService.getAllConversations();
        return ResponseEntity.ok().body(responses);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversation(String id) {
        conversationService.deleteConversation(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConversationResponse> updateConversation(@PathVariable String id,
            @RequestBody ConversationRequest request) {
        ConversationResponse response = conversationService.updateConversation(id, request);
        return ResponseEntity.ok().body(response);
    }
}
