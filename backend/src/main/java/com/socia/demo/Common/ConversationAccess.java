package com.socia.demo.Common;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import com.socia.demo.Conversation.model.*;
import com.socia.demo.Conversation.repository.ConversationRepository;
import com.socia.demo.Enum.ConversationType;
import com.socia.demo.User.model.User;
@Component
@RequiredArgsConstructor
public class ConversationAccess {
    private final ConversationRepository conversations;

    public Conversation requireRoom(UUID roomId, UUID userId) {
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

    public User otherMember(Conversation room, UUID meId) {
        return room.getParticipants().stream()
                .map(ConversationParticipant::getUser)
                .filter(user -> !user.getId().equals(meId))
                .findFirst()
                .orElseThrow(() -> Common.error(HttpStatus.BAD_REQUEST, "Phòng thiếu thành viên."));
    }

}
