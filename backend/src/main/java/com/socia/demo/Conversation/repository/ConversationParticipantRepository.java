package com.socia.demo.Conversation.repository;
import java.util.*;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;
import com.socia.demo.Conversation.model.ConversationParticipant;
public interface ConversationParticipantRepository extends JpaRepository<ConversationParticipant, UUID> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from ConversationParticipant p where p.conversation.id = :room and p.user.id = :user")
    Optional<ConversationParticipant> lockMember(@Param("room") UUID room, @Param("user") UUID user);
}
