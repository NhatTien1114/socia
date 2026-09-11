package com.socia.demo.Conversation.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.socia.demo.Conversation.dtos.request.ConversationRequest;
import com.socia.demo.Conversation.dtos.response.ConversationResponse;
import com.socia.demo.Conversation.mapper.ConversationMapper;
import com.socia.demo.Conversation.model.Conversation;
import com.socia.demo.Conversation.repository.ConversationRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class ConversationService {
    ConversationRepository conversationRepository;
    ConversationMapper conversationMapper;

    public ConversationResponse createConversation(ConversationRequest request) {
        Conversation conversation = conversationMapper.toEntity(request);
        var savedConversation = conversationRepository.save(conversation);
        return conversationMapper.toResponse(savedConversation);
    }

    public List<ConversationResponse> getAllConversations() {
        var conversations = conversationRepository.findAll();
        return conversations.stream()
                .map(conversationMapper::toResponse)
                .toList();
    }

    public ConversationResponse getConversationById(String id) {
        var conversation = conversationRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        return conversationMapper.toResponse(conversation);
    }

    public void deleteConversation(String id) {
        var conversation = conversationRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversationRepository.delete(conversation);
    }

    public ConversationResponse updateConversation(String id, ConversationRequest request) {
        var conversation = conversationRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("Conversation not found"));
        conversationMapper.updateConversation(request, conversation);
        var updatedConversation = conversationRepository.save(conversation);
        return conversationMapper.toResponse(updatedConversation);
    }
}
