package com.socia.demo.Common;
import java.util.*;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.FriendRequestRepository;
import com.socia.demo.Conversation.repository.ConversationRepository;
@Component @RequiredArgsConstructor
public class PresenceAudience {
    private final FriendRequestRepository friendships;
    private final ConversationRepository rooms;
    // Visibility is symmetric: accepted friends or members sharing a conversation.
    @Transactional(readOnly=true)
    public Map<UUID, String> visibleTo(UUID userId) {
        Map<UUID, String> result = new HashMap<>();
        for (var friendship : friendships.findFriendsByUserId(userId)) {
            User other = friendship.getSender().getId().equals(userId) ? friendship.getReceiver() : friendship.getSender();
            result.put(other.getId(), other.getUsername());
        }
        for (var room : rooms.findConversationsForMember(userId))
            for (var p : room.getParticipants()) result.put(p.getUser().getId(), p.getUser().getUsername());
        result.remove(userId);
        return result;
    }
}
