package com.socia.demo.Conversation.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.socia.demo.Conversation.dtos.request.ConversationRequest;
import com.socia.demo.Conversation.dtos.response.ConversationResponse;
import com.socia.demo.Conversation.model.Conversation;

@Mapper(componentModel = "spring")
public interface ConversationMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    Conversation toEntity(ConversationRequest request);

    ConversationResponse toResponse(Conversation conversation);

    void updateConversation(ConversationRequest request, @MappingTarget Conversation conversation);
}
