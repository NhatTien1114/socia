package com.socia.demo.Message.repository;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import com.socia.demo.Message.model.MessageImage;

public interface MessageImageRepository extends JpaRepository<MessageImage, UUID> {
    Optional<MessageImage> findByIdAndMessage_Conversation_Id(UUID id, UUID conversationId);
}
