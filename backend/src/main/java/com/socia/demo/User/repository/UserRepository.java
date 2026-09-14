package com.socia.demo.User.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.socia.demo.User.model.User;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> getUserByUsername(String username);
}
