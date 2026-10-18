package com.socia.demo.Chat.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import com.socia.demo.Chat.dtos.response.BootstrapResponse;
import com.socia.demo.Chat.dtos.response.ConversationSummaryResponse;
import com.socia.demo.Chat.dtos.response.UserSummaryResponse;
import com.socia.demo.Common.Common;
import com.socia.demo.Conversation.model.Conversation;
import com.socia.demo.Conversation.model.ConversationParticipant;
import com.socia.demo.Conversation.repository.ConversationRepository;
import com.socia.demo.Enum.ConversationType;
import com.socia.demo.Enum.MessageType;
import com.socia.demo.Enum.ParticipantRole;
import com.socia.demo.Message.dtos.response.MessagePageResponse;
import com.socia.demo.Message.dtos.response.MessageResponse;
import com.socia.demo.Message.dtos.response.MessageSavedResponse;
import com.socia.demo.Message.model.Message;
import com.socia.demo.Message.repository.MessageRepository;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.FriendRequestRepository;
import com.socia.demo.User.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

        private final UserRepository users;
        private final FriendRequestRepository friendships;
        private final ConversationRepository conversations;
        private final MessageRepository messages;
        private final ApplicationEventPublisher events;
        private final Common common;

        public BootstrapResponse bootstrap(String username) {
                User me = common.requireUser(username);

                List<UserSummaryResponse> friends = friendships.findFriendsByUserId(me.getId())
                                .stream()
                                .map(request -> request.getSender().getId().equals(me.getId())
                                                ? request.getReceiver()
                                                : request.getSender())
                                .map(this::userSummary)
                                .distinct()
                                .toList();

                List<ConversationSummaryResponse> rooms = conversations.findConversationsForMember(me.getId())
                                .stream()
                                .map(room -> conversationSummary(room, me.getId()))
                                .toList();

                return BootstrapResponse.builder()
                                .me(userSummary(me))
                                .friends(friends)
                                .conversation(rooms)
                                .build();
        }

        @Transactional(isolation = Isolation.READ_COMMITTED)
        public ConversationSummaryResponse openDirect(
                        String username,
                        UUID friendId) {
                User me = common.requireUser(username);

                if (me.getId().equals(friendId)) {
                        throw Common.error(HttpStatus.BAD_REQUEST, "Không thể chat với chính mình.");
                }

                User friend = users.findById(friendId)
                                .orElseThrow(() -> Common.error(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));

                String first = me.getId().toString();
                String second = friendId.toString();

                if (first.compareTo(second) > 0) {
                        String temporary = first;
                        first = second;
                        second = temporary;
                }

                String directKey = first + ":" + second;

                users.findByIdForUpdate(UUID.fromString(first))
                                .orElseThrow(() -> Common.error(HttpStatus.NOT_FOUND, "Không tìm thấy người dùng."));

                common.requireFriendship(me.getId(), friendId);

                var existing = conversations.findByDirectKey(directKey);

                if (existing.isPresent()) {
                        return conversationSummary(existing.get(), me.getId());
                }

                Conversation room = Conversation.builder()
                                .conversationType(ConversationType.DIRECT)
                                .directKey(directKey)
                                .createdPerson(me)
                                .build();

                room.getParticipants().add(
                                ConversationParticipant.builder()
                                                .conversation(room)
                                                .user(me)
                                                .role(ParticipantRole.MEMBER)
                                                .build());

                room.getParticipants().add(
                                ConversationParticipant.builder()
                                                .conversation(room)
                                                .user(friend)
                                                .role(ParticipantRole.MEMBER)
                                                .build());

                conversations.saveAndFlush(room);

                return conversationSummary(room, me.getId());
        }

        public MessagePageResponse history(
                        String username,
                        UUID conversationId,
                        UUID before,
                        int requestedLimit) {
                User me = common.requireUser(username);
                requireRoom(conversationId, me.getId());

                int limit = Math.max(1, Math.min(requestedLimit, 100));

                var pageable = PageRequest.of(
                                0,
                                limit + 1,
                                Sort.by(
                                                Sort.Order.desc("createdAt"),
                                                Sort.Order.desc("id")));

                List<Message> found;

                if (before == null) {
                        found = messages.findByConversationId(conversationId, pageable);
                } else {
                        Message anchor = messages
                                        .findByIdAndConversationId(before, conversationId)
                                        .orElseThrow(() -> Common.error(HttpStatus.BAD_REQUEST,
                                                        "Cursor không hợp lệ."));

                        found = messages.findOlderMessages(
                                        conversationId,
                                        anchor.getCreatedAt(),
                                        anchor.getId(),
                                        pageable);
                }

                boolean hasMore = found.size() > limit;
                List<Message> selected = found.subList(0, Math.min(limit, found.size()));

                UUID nextBefore = hasMore
                                ? selected.getLast().getId()
                                : null;

                List<MessageResponse> items = new ArrayList<>(
                                selected.stream().map(this::messageResponse).toList());

                Collections.reverse(items);

                return MessagePageResponse.builder()
                                .items(List.copyOf(items))
                                .nextBefore(nextBefore)
                                .build();
        }

        @Transactional
        public MessageResponse send(
                        String username,
                        UUID conversationId,
                        String rawContent) {
                User me = common.requireUser(username);
                Conversation room = requireRoom(conversationId, me.getId());
                if (room.getConversationType() == ConversationType.DIRECT) {
                        User friend = otherMember(room, me.getId());
                        common.requireFriendship(me.getId(), friend.getId());
                }

                String content = rawContent == null ? "" : rawContent.strip();

                if (content.isBlank() || content.length() > 2000) {
                        throw Common.error(
                                        HttpStatus.BAD_REQUEST,
                                        "Tin nhắn phải có từ 1 đến 2000 ký tự.");
                }

                Message saved = messages.saveAndFlush(
                                Message.builder()
                                                .conversation(room)
                                                .sender(me)
                                                .content(content)
                                                .messageType(MessageType.TEXT)
                                                .build());

                MessageResponse response = messageResponse(saved);

                events.publishEvent(
                                MessageSavedResponse.builder()
                                                .message(response)
                                                .usernames(room.getParticipants().stream()
                                                                .map(p -> p.getUser().getUsername()).distinct().toList())
                                                .build());

                return response;
        }

        private Conversation requireRoom(UUID roomId, UUID userId) {
                Conversation room = conversations.findById(roomId)
                                .orElseThrow(() -> Common.error(HttpStatus.NOT_FOUND,
                                                "Không tìm thấy cuộc trò chuyện."));

                boolean member = room.getParticipants().stream()
                                .anyMatch(p -> p.getUser().getId().equals(userId));

                if (!member) {
                        throw Common.error(
                                        HttpStatus.FORBIDDEN,
                                        "Bạn không thuộc cuộc trò chuyện này.");
                }

                if (room.getConversationType() != ConversationType.GROUP
                                && (room.getConversationType() != ConversationType.DIRECT
                                                || room.getParticipants().size() != 2)) {
                        throw Common.error(
                                        HttpStatus.BAD_REQUEST,
                                        "Cuộc trò chuyện không phải phòng 1–1 hợp lệ.");
                }

                return room;
        }

        private User otherMember(Conversation room, UUID meId) {
                return room.getParticipants().stream()
                                .map(ConversationParticipant::getUser)
                                .filter(user -> !user.getId().equals(meId))
                                .findFirst()
                                .orElseThrow(() -> Common.error(HttpStatus.BAD_REQUEST, "Phòng thiếu thành viên."));
        }

        private UserSummaryResponse userSummary(User user) {
                return UserSummaryResponse.builder()
                                .id(user.getId())
                                .username(user.getUsername())
                                .displayName(user.getDisplayName())
                                .avatar(user.getAvatar())
                                .build();
        }

        private ConversationSummaryResponse conversationSummary(
                        Conversation room,
                        UUID meId) {
                return ConversationSummaryResponse.builder()
                                .id(room.getId())
                                .friend(room.getConversationType() == ConversationType.DIRECT
                                                ? userSummary(otherMember(room, meId)) : null)
                                .conversationType(room.getConversationType())
                                .name(room.getName())
                                .avatar(room.getAvatar())
                                .participants(room.getParticipants().stream()
                                                .map(p -> userSummary(p.getUser())).toList())
                                .build();
        }

        private MessageResponse messageResponse(Message message) {
                return MessageResponse.builder()
                                .id(message.getId())
                                .conversationId(message.getConversation().getId())
                                .senderId(message.getSender().getId())
                                .content(message.getContent())
                                .createdAt(message.getCreatedAt())
                                .build();
        }
}
