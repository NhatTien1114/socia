package com.socia.demo.User.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.socia.demo.User.dtos.request.FriendRequestDto;
import com.socia.demo.User.dtos.response.FriendResponse;
import com.socia.demo.User.service.FriendRequestService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/friends")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FriendRequestController {
    FriendRequestService friendRequestService;

    @PostMapping("/request")
    public ResponseEntity<FriendResponse> sendFriendRequest(@RequestBody FriendRequestDto request) {
        return ResponseEntity.ok(friendRequestService.sendFriendRequest(request));
    }

    @PutMapping("/{requestId}/respond")
    public ResponseEntity<FriendResponse> respondFriendRequest(@PathVariable UUID requestId,
            @RequestParam Boolean accept) {
        return ResponseEntity
                .status(HttpStatus.ACCEPTED)
                .body(friendRequestService.responseFriendRequest(requestId, accept));
    }

    @GetMapping
    public ResponseEntity<List<FriendResponse>> getListFriend() {
        return ResponseEntity.ok(friendRequestService.getListFriend());
    }

    @GetMapping("/pending")
    public ResponseEntity<List<FriendResponse>> getListPendingFriendRequest() {
        return ResponseEntity.ok(friendRequestService.getListPendingFriendRequest());
    }

    @GetMapping("/sent")
    public ResponseEntity<List<FriendResponse>> getListSentFriendRequest() {
        return ResponseEntity.ok(friendRequestService.getListSentFriendRequest());
    }

    @DeleteMapping("/{requestId}")
    public ResponseEntity<Void> cancelFriendRequest(@PathVariable UUID requestId) {
        friendRequestService.cancelFriendRequest(requestId);
        return ResponseEntity.noContent().build();
    }
}
