package com.socia.demo.User.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.socia.demo.Enum.FriendRequestStatus;
import com.socia.demo.User.dtos.request.FriendRequestDto;
import com.socia.demo.User.dtos.response.FriendResponse;
import com.socia.demo.User.mapper.FriendRequestMapper;
import com.socia.demo.User.model.FriendRequest;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.FriendRequestRepository;
import com.socia.demo.User.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@Transactional
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class FriendRequestService {
    FriendRequestRepository friendRequestRepository;
    UserRepository userRepository;
    FriendRequestMapper friendRequestMapper;

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new RuntimeException("User is unauthenticated or token is invalid");
        }
        String username = jwt.getSubject();
        return userRepository.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));
    }

    public FriendResponse sendFriendRequest(FriendRequestDto request) {
        var user = getCurrentUser();

        User receiver = null;
        if (request.getRecieverName() != null && !request.getRecieverName().isBlank()) {
            receiver = userRepository.getUserByUsername(request.getRecieverName())
                    .orElse(null);
        }
        if (receiver == null && request.getRecieverPhone() != null && !request.getRecieverPhone().isBlank()) {
            receiver = userRepository.getUserByPhone(request.getRecieverPhone())
                    .orElse(null);
        }
        if (receiver == null) {
            throw new RuntimeException("User not found with given username or phone");
        }

        if (user.getId().equals(receiver.getId())) {
            throw new RuntimeException("You cannot send a friend request to yourself");
        }
        if (friendRequestRepository.findBySenderIdAndReceiverId(user.getId(), receiver.getId()).isPresent()
                || friendRequestRepository.findBySenderIdAndReceiverId(receiver.getId(), user.getId()).isPresent()) {
            throw new RuntimeException("Friend request or friendship already exists between these users");
        }

        var friendRequest = FriendRequest.builder()
                .sender(user)
                .receiver(receiver)
                .status(FriendRequestStatus.PENDING)
                .build();
        return friendRequestMapper.toFriendResponse(friendRequestRepository.save(friendRequest));
    }

    public FriendResponse responseFriendRequest(UUID requestId, Boolean accept) {
        var user = getCurrentUser();
        var friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found with id: " + requestId));

        if (!friendRequest.getReceiver().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to respond to this friend request (only the receiver can accept/reject)");
        }

        if (friendRequest.getStatus() != FriendRequestStatus.PENDING) {
            throw new RuntimeException("Friend request has already been " + friendRequest.getStatus());
        }

        if (Boolean.TRUE.equals(accept)) {
            friendRequest.setStatus(FriendRequestStatus.ACCEPTED);
            friendRequest.setRespondedAt(LocalDateTime.now());
        } else {
            friendRequest.setStatus(FriendRequestStatus.REJECTED);
            friendRequest.setRespondedAt(LocalDateTime.now());
        }
        return friendRequestMapper.toFriendResponse(friendRequestRepository.save(friendRequest));
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getListFriend() {
        var user = getCurrentUser();
        var friendRequests = friendRequestRepository.findFriendsByUserId(user.getId());
        return friendRequests.stream()
                .map(friendRequestMapper::toFriendResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getListPendingFriendRequest() {
        var user = getCurrentUser();
        var friendRequests = friendRequestRepository.findByReceiverIdAndStatus(user.getId(),
                FriendRequestStatus.PENDING);
        return friendRequests.stream()
                .map(friendRequestMapper::toFriendResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<FriendResponse> getListSentFriendRequest() {
        var user = getCurrentUser();
        var friendRequests = friendRequestRepository.findBySenderIdAndStatus(user.getId(),
                FriendRequestStatus.PENDING);
        return friendRequests.stream()
                .map(friendRequestMapper::toFriendResponse)
                .collect(Collectors.toList());
    }

    public void cancelFriendRequest(UUID requestId) {
        var user = getCurrentUser();
        var friendRequest = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new RuntimeException("Friend request not found with id: " + requestId));

        if (!friendRequest.getSender().getId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to cancel this friend request");
        }

        friendRequestRepository.delete(friendRequest);
    }
}
