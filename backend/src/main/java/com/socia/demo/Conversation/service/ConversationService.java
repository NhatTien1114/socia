package com.socia.demo.Conversation.service;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.socia.demo.Conversation.dtos.request.ConversationGroupRequest;
import com.socia.demo.Conversation.dtos.response.ConversationResponse;
import com.socia.demo.Conversation.mapper.ConversationMapper;
import com.socia.demo.Conversation.model.Conversation;
import com.socia.demo.Conversation.model.ConversationParticipant;
import com.socia.demo.Conversation.repository.ConversationRepository;
import com.socia.demo.Enum.ConversationType;
import com.socia.demo.Enum.FriendRequestStatus;
import com.socia.demo.Enum.ParticipantRole;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.UserRepository;
import com.socia.demo.User.repository.FriendRequestRepository;
import com.socia.demo.User.service.UploadThingStorage;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ConversationService {
    private final ConversationRepository conversations;
    private final ConversationMapper mapper;
    private final UserRepository users;
    private final FriendRequestRepository friendships;
    private final UploadThingStorage storage;

    public List<ConversationResponse> getGroups(String username) {
        User me = requireUser(username);
        return conversations.findGroupsForMember(me.getId()).stream().map(mapper::toResponse).toList();
    }

    @Transactional
    public ConversationResponse createGroup(String username, ConversationGroupRequest request, MultipartFile avatar) {
        User me = requireUser(username);
        String name = request.getName() == null ? "" : request.getName().strip();
        if (name.isEmpty() || name.length() > 255)
            throw error(HttpStatus.BAD_REQUEST, "Tên nhóm cần từ 1 đến 255 ký tự.");
        if (request.getParticipantId() == null || request.getParticipantId().stream().anyMatch(java.util.Objects::isNull))
            throw error(HttpStatus.BAD_REQUEST, "Danh sách thành viên không hợp lệ.");
        var ids = new HashSet<>(request.getParticipantId());
        ids.remove(me.getId());
        if (ids.size() < 2)
            throw error(HttpStatus.BAD_REQUEST, "Nhóm cần ít nhất 2 bạn bè ngoài người tạo.");
        Conversation group = Conversation.builder().name(name).conversationType(ConversationType.GROUP)
                .createdPerson(me).build();
        group.getParticipants().add(ConversationParticipant.builder().conversation(group).user(me)
                .role(ParticipantRole.ADMIN).build());
        for (UUID id : ids) {
            User member = users.findById(id).orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Không tìm thấy thành viên."));
            boolean friends = friendships.findBySenderIdAndReceiverId(me.getId(), id)
                    .filter(r -> r.getStatus() == FriendRequestStatus.ACCEPTED).isPresent()
                    || friendships.findBySenderIdAndReceiverId(id, me.getId())
                    .filter(r -> r.getStatus() == FriendRequestStatus.ACCEPTED).isPresent();
            if (!friends) throw error(HttpStatus.FORBIDDEN, "Chỉ được thêm người đã kết bạn vào nhóm.");
            group.getParticipants().add(ConversationParticipant.builder().conversation(group).user(member)
                    .role(ParticipantRole.MEMBER).build());
        }
        // Validate every member before uploading; failed uploads never create a partial group.
        if (avatar != null) group.setAvatar(storage.upload(avatar));
        else group.setAvatar(request.getAvatar());
        return mapper.toResponse(conversations.saveAndFlush(group));
    }

    @Transactional
    public ConversationResponse updateAvatar(String username, UUID id, MultipartFile avatar) {
        User me = requireUser(username);
        Conversation group = conversations.findById(id)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "Không tìm thấy nhóm."));
        if (group.getConversationType() != ConversationType.GROUP)
            throw error(HttpStatus.BAD_REQUEST, "Đây không phải cuộc trò chuyện nhóm.");
        boolean admin = group.getParticipants().stream().anyMatch(p -> p.getUser().getId().equals(me.getId())
                && p.getRole() == ParticipantRole.ADMIN);
        if (!admin) throw error(HttpStatus.FORBIDDEN, "Chỉ quản trị viên nhóm được đổi ảnh đại diện.");
        group.setAvatar(storage.upload(avatar));
        return mapper.toResponse(conversations.saveAndFlush(group));
    }

    private User requireUser(String username) {
        return users.getUserByUsername(username)
                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."));
    }
    private ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }
}
