package com.socia.demo.Conversation.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.socia.demo.Conversation.model.Conversation;

public interface ConversationRepository
        extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByDirectKey(String directKey);

    @Query("""
            select c
            from Conversation c
            join c.participants p
            where p.user.id = :userId
              and c.directKey is not null
            order by c.createdAt desc
            """)
    List<Conversation> findDirectConversations(
            @Param("userId") UUID userId);
}