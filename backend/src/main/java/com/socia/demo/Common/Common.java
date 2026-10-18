package com.socia.demo.Common;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.socia.demo.Enum.FriendRequestStatus;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.FriendRequestRepository;
import com.socia.demo.User.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Component
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class Common {
        UserRepository userRepository;
        FriendRequestRepository friendRequestRepository;

        public User requireUser(String username) {
                return userRepository.getUserByUsername(username)
                                .orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại."));
        }

        public static ResponseStatusException error(HttpStatus status, String message) {
                return new ResponseStatusException(status, message);
        }

        public void requireFriendship(UUID first, UUID second) {
                boolean accepted = friendRequestRepository.findBySenderIdAndReceiverId(first, second)
                                .filter(r -> r.getStatus() == FriendRequestStatus.ACCEPTED)
                                .isPresent()
                                ||
                                friendRequestRepository.findBySenderIdAndReceiverId(second, first)
                                                .filter(r -> r.getStatus() == FriendRequestStatus.ACCEPTED)
                                                .isPresent();

                if (!accepted) {
                        throw error(HttpStatus.FORBIDDEN, "Chỉ được nhắn tin với người đã kết bạn.");
                }
        }
}
