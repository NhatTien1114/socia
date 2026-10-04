package com.socia.demo.User.service;

import java.util.List;
import java.util.UUID;
import java.nio.charset.StandardCharsets;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
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

    private User getCurrentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof Jwt jwt)) {
            throw new RuntimeException("User is unauthenticated");
        }
        String username = jwt.getSubject();
        return userRepository.getUserByUsername(username)
                .orElseThrow(() -> new RuntimeException("Authenticated user not found: " + username));
    }

    public UserResponse createUser(UserRequest userRequest) {
        requireAdmin();
        User user = userMapper.toUser(userRequest);
        user.setPassword(new BCryptPasswordEncoder().encode(userRequest.getPassword()));
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
        requireAdmin();
        User existingUser = userRepository.findById(UUID.fromString(id))
                .orElseThrow(() -> new RuntimeException("User not found"));
        String existingPassword = existingUser.getPassword();
        userMapper.updateUser(userRequest, existingUser);
        if (userRequest.getPassword() != null) {
            existingUser.setPassword(new BCryptPasswordEncoder().encode(userRequest.getPassword()));
        } else {
            existingUser.setPassword(existingPassword);
        }
        User updatedUser = userRepository.save(existingUser);
        return userMapper.toUserResponse(updatedUser);
    }

    public void deleteUser(String id) {
        requireAdmin();
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

    public List<UserResponse> searchUsers(String query) {
        if (query == null || query.trim().isEmpty()) {
            return List.of();
        }
        var currentUser = getCurrentUser();
        List<User> users = userRepository.searchUsers(query.trim(), currentUser.getId());
        return users.stream()
                .map(userMapper::toUserResponse)
                .toList();
    }

    private void requireAdmin() {
        if (getCurrentUser().getRole() != Role.ADMIN)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không có quyền thực hiện thao tác này.");
    }

    @Transactional
    public void changePassword(String oldPass, String newPass) {
        if (oldPass == null || oldPass.isEmpty() || oldPass.getBytes(StandardCharsets.UTF_8).length > 72
                || newPass == null || newPass.isBlank() || newPass.length() < 8
                || newPass.getBytes(StandardCharsets.UTF_8).length > 72)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới cần ít nhất 8 ký tự và tối đa 72 byte.");
        User currentUser = getCurrentUser();
        PasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
        if (!passwordEncoder.matches(oldPass, currentUser.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu hiện tại không đúng.");
        }
        if (passwordEncoder.matches(newPass, currentUser.getPassword()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mật khẩu mới phải khác mật khẩu hiện tại.");
        currentUser.setPassword(passwordEncoder.encode(newPass));
        userRepository.save(currentUser);
    }
}
