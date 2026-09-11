package com.socia.demo.Conversation.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.socia.demo.Conversation.model.Conversation;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

}
