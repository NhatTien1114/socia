package com.socia.demo.User.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.socia.demo.User.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> getUserByUsername(String username);

    Optional<User> getUserByPhone(String phone);

    @Query("SELECT u FROM User u WHERE (LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR u.phone LIKE CONCAT('%', :query, '%')) AND u.id <> :currentUserId")
    List<User> searchUsers(@Param("query") String query, @Param("currentUserId") UUID currentUserId);
}
