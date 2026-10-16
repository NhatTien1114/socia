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
            select distinct c from Conversation c
            left join fetch c.participants
            join fetch c.createdPerson
            where c.conversationType = com.socia.demo.Enum.ConversationType.GROUP
              and exists (select p.id from ConversationParticipant p
                          where p.conversation = c and p.user.id = :userId)
            order by c.createdAt desc, c.id desc
            """)
    List<Conversation> findGroupsForMember(@Param("userId") UUID userId);

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
