package com.socia.demo.Message.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.*;
import lombok.RequiredArgsConstructor;
import com.socia.demo.Common.*;
import com.socia.demo.Conversation.repository.ConversationParticipantRepository;
import com.socia.demo.Message.repository.*;
import com.socia.demo.Message.model.MessageRead;
import com.socia.demo.Message.dtos.response.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MessageReadService {
    private final Common common;
    private final ConversationAccess access;
    private final ConversationParticipantRepository participants;
    private final MessageRepository messages;
    private final MessageReadRepository reads;
    private final ApplicationEventPublisher events;

    public record Saved(ReadReceiptBatch batch, List<String> usernames) {}

    private MessageReadResponse response(MessageRead read) {
        return new MessageReadResponse(read.getMessage().getId(), read.getUser().getId(), read.getReadAt());
    }
    public void attach(List<MessageResponse> items) {
        if (items.isEmpty()) return;
        var grouped = reads.findByMessageIdIn(items.stream().map(MessageResponse::getId).toList()).stream()
            .map(this::response).collect(Collectors.groupingBy(MessageReadResponse::messageId));
        items.forEach(item -> item.setReads(grouped.getOrDefault(item.getId(), List.of())));
    }

    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReadReceiptBatch mark(String username, UUID roomId, List<UUID> ids) {
        var me = common.requireUser(username);
        var room = access.requireRoom(roomId, me.getId());
        if (ids == null || ids.isEmpty() || ids.size() > 100 || ids.stream().anyMatch(Objects::isNull))
            throw Common.error(HttpStatus.BAD_REQUEST, "Cần từ 1 đến 100 ID tin nhắn hợp lệ.");
        // Serialize all read writes for this member, including requests from different tabs.
        participants.lockMember(roomId, me.getId())
                .orElseThrow(() -> Common.error(HttpStatus.FORBIDDEN, "Không thuộc phòng."));
        var unique = new HashSet<>(ids);
        var found = messages.findAllById(unique);
        if (found.size() != unique.size() || found.stream().anyMatch(m -> !m.getConversation().getId().equals(roomId)))
            throw Common.error(HttpStatus.BAD_REQUEST, "Tin nhắn không thuộc phòng hoặc không tồn tại.");
        var existing = reads.findByMessageIdInAndUserId(unique, me.getId()).stream()
            .collect(Collectors.toMap(r -> r.getMessage().getId(), r -> r));
        List<MessageReadResponse> result = new ArrayList<>();
        List<MessageReadResponse> added = new ArrayList<>();
        for (var message : found) {
            if (message.getSender().getId().equals(me.getId())) continue;
            var read = existing.get(message.getId());
            if (read == null) {
                // Match database timestamp precision so retries return the same readAt.
                read = reads.save(MessageRead.builder().message(message).user(me)
                        .readAt(Instant.now().truncatedTo(ChronoUnit.MICROS)).build());
                added.add(response(read));
            }
            result.add(response(read));
        }
        if (!added.isEmpty()) {
            events.publishEvent(new Saved(new ReadReceiptBatch(roomId, List.copyOf(added)),
                    room.getParticipants().stream().map(p -> p.getUser().getUsername()).distinct().toList()));
        }
        return new ReadReceiptBatch(roomId, List.copyOf(result));
    }
}
