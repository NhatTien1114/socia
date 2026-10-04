package com.socia.demo.User.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.socia.demo.User.dtos.request.UserRequest;
import com.socia.demo.User.dtos.response.UserResponse;
import com.socia.demo.User.model.User;

@Mapper(componentModel = "spring")
public interface UserMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "displayName", ignore = true)
    @Mapping(target = "birthDate", ignore = true)
    User toUser(UserRequest request);

    UserResponse toUserResponse(User user);

    @Mapping(target = "displayName", ignore = true)
    @Mapping(target = "birthDate", ignore = true)
    void updateUser(UserRequest request, @MappingTarget User user);
}
