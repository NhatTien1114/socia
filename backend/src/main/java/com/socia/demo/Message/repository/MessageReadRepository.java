package com.socia.demo.Message.repository;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
import com.socia.demo.Message.model.MessageRead;
public interface MessageReadRepository extends JpaRepository<MessageRead, UUID> {
    List<MessageRead> findByMessageIdIn(Collection<UUID> ids);
    List<MessageRead> findByMessageIdInAndUserId(Collection<UUID> ids, UUID userId);
}
