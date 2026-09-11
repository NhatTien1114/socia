package com.socia.demo.User.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.socia.demo.Enum.Role;
import com.socia.demo.User.dtos.request.UserRequest;
import com.socia.demo.User.dtos.response.UserResponse;
import com.socia.demo.User.mapper.UserMapper;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class UserService {
    UserRepository userRepository;
    UserMapper userMapper;

    public UserResponse createUser(UserRequest userRequest) {
        User user = userMapper.toUser(userRequest);
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        User savedUser = userRepository.save(user);
        return userMapper.toUserResponse(savedUser);
    }

    public UserResponse getUserById(String id) {
        User user = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return userMapper.toUserResponse(user);
    }

    public UserResponse updateUser(String id, UserRequest userRequest) {
        User existingUser = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("User not found"));
        userMapper.updateUser(userRequest, existingUser);
        User updatedUser = userRepository.save(existingUser);
        return userMapper.toUserResponse(updatedUser);
    }

    public void deleteUser(String id) {
        User existingUser = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(existingUser);
    }

    public List<UserResponse> getAllUsers() {
        List<User> users = userRepository.findAll();
        return users.stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

}
