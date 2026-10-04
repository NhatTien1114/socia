package com.socia.demo.Message.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.socia.demo.Message.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByConversationId(UUID conversationId, Pageable pageable);

    Optional<Message> findByIdAndConversationId(UUID id, UUID conversationId);

    @Query("""
            select m
            from Message m
            where m.conversation.id = :conversationId
              and (
                  m.createdAt < :createdAt
                  or (m.createdAt = :createdAt and m.id < :id)
              )
            """)
    List<Message> findOlderMessages(
            @Param("conversationId") UUID conversationId,
            @Param("createdAt") LocalDateTime createdAt,
            @Param("id") UUID id,
            Pageable pageable);
}
