package com.socia.demo.User.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.socia.demo.User.dtos.response.FriendResponse;
import com.socia.demo.User.model.FriendRequest;

@Mapper(componentModel = "spring")
public interface FriendRequestMapper {
    @Mapping(target = "sender", source = "sender.username")
    @Mapping(target = "receiver", source = "receiver.username")
    FriendResponse toFriendResponse(FriendRequest friendRequest);
}
