package com.socia.demo.User.service;

import java.time.LocalDate;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import com.socia.demo.User.dtos.request.ProfileUpdateRequest;
import com.socia.demo.User.dtos.response.ProfileResponse;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.UserRepository;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ProfileService {
    private final UserRepository users;
    private final UploadThingStorage storage;
    private final TransactionTemplate transactions;

    private User currentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Vui lòng đăng nhập lại.");
        return users.getUserByUsername(jwt.getSubject()).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại."));
    }

    public ProfileResponse get() {
        return ProfileResponse.from(currentUser());
    }

    public ProfileResponse update(ProfileUpdateRequest request, MultipartFile avatar) {
        UUID id = currentUser().getId();
        String name = request.displayName() == null ? "" : request.displayName().strip();
        String phone = request.phone() == null ? "" : request.phone().strip();
        if (name.isEmpty() || name.length() > 80)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Tên hiển thị cần từ 1 đến 80 ký tự.");
        if (!phone.isEmpty() && !phone.matches("\\+?[0-9]{9,15}"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +.");
        if (request.birthDate() != null && (request.birthDate().isAfter(LocalDate.now())
                || request.birthDate().isBefore(LocalDate.of(1900, 1, 1))))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Ngày sinh không hợp lệ.");

        // Complete remote IO before the transaction, then reload to avoid overwriting a password change.
        String avatarUrl = avatar == null ? null : storage.upload(avatar);
        return transactions.execute(status -> {
            User user = users.findById(id).orElseThrow(() ->
                    new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Tài khoản không còn tồn tại."));
            user.setDisplayName(name);
            user.setPhone(phone.isEmpty() ? null : phone);
            user.setSex(request.sex());
            user.setBirthDate(request.birthDate());
            if (avatarUrl != null) user.setAvatar(avatarUrl);
            return ProfileResponse.from(users.saveAndFlush(user));
        });
    }
}
