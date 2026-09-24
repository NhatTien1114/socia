package com.socia.demo.User.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.socia.demo.Enum.FriendRequestStatus;
import com.socia.demo.User.model.FriendRequest;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, UUID> {
    Optional<FriendRequest> findBySenderIdAndReceiverId(UUID senderId, UUID receiverId);

    @Query("SELECT fr FROM FriendRequest fr WHERE (fr.sender.id = :userId OR fr.receiver.id = :userId) AND fr.status = :status")
    List<FriendRequest> findFriendsByUserIdAndStatus(@Param("userId") UUID userId, @Param("status") FriendRequestStatus status);

    default List<FriendRequest> findFriendsByUserId(UUID userId) {
        return findFriendsByUserIdAndStatus(userId, FriendRequestStatus.ACCEPTED);
    }

    Optional<FriendRequest> findByReceiverId(UUID recieverId);

    Optional<FriendRequest> findBySenderId(UUID senderId);

    List<FriendRequest> findByReceiverIdAndStatus(UUID receiverId, FriendRequestStatus status);

    List<FriendRequest> findBySenderIdAndStatus(UUID senderId, FriendRequestStatus status);
}
