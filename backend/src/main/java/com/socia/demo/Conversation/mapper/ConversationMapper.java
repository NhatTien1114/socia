package com.socia.demo.Conversation.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.socia.demo.Conversation.dtos.response.ConversationResponse;
import com.socia.demo.Conversation.model.Conversation;

@Mapper(componentModel = "spring")
public interface ConversationMapper {

    @Mapping(target = "createdPersonId", source = "createdPerson.id")
    @Mapping(target = "memberCount", expression = "java(conversation.getParticipants().size())")
    ConversationResponse toResponse(Conversation conversation);
}
