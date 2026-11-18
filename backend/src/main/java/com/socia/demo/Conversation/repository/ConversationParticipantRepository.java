package com.socia.demo.Conversation.repository;

import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import com.socia.demo.Conversation.model.ConversationParticipant;

public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {
    @Query(value = "select * from conversation_participants where conversation_id = :room and user_id = :user for update", nativeQuery = true)
    Optional<ConversationParticipant> lockMember(@Param("room") UUID room, @Param("user") UUID user);
}
