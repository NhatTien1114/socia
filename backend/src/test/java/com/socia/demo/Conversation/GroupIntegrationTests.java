package com.socia.demo.Conversation;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import com.socia.demo.Conversation.dtos.request.ConversationGroupRequest;
import com.socia.demo.Conversation.repository.ConversationRepository;
import com.socia.demo.Conversation.service.ConversationService;
import com.socia.demo.User.model.User;
import com.socia.demo.User.model.FriendRequest;
import com.socia.demo.User.repository.UserRepository;
import com.socia.demo.User.repository.FriendRequestRepository;
import com.socia.demo.User.service.UploadThingStorage;
import com.socia.demo.Enum.FriendRequestStatus;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:group-tests;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never"
})
@AutoConfigureMockMvc
@Transactional
class GroupIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @Autowired FriendRequestRepository friendships;
    @Autowired ConversationRepository conversations;
    @Autowired ConversationService service;
    @MockitoBean UploadThingStorage storage;
    User me, first, second, outsider;

    User user() { return users.save(User.builder().username(UUID.randomUUID().toString()).password("private").build()); }
    @BeforeEach void setup() {
        me = user(); first = user(); second = user(); outsider = user();
        friendships.save(FriendRequest.builder().sender(me).receiver(first).status(FriendRequestStatus.ACCEPTED).build());
        friendships.save(FriendRequest.builder().sender(second).receiver(me).status(FriendRequestStatus.ACCEPTED).build());
    }
    ConversationGroupRequest request() {
        return ConversationGroupRequest.builder().name("Study group").participantId(List.of(first.getId(), second.getId())).build();
    }
    String json() { return "{\"name\":\"Study group\",\"participantId\":[\"" + first.getId() + "\",\"" + second.getId() + "\"]}"; }
    MockMultipartFile avatar() { return new MockMultipartFile("avatar", "group.png", "image/png", new byte[] {1, 2}); }

    @Test void groupsOnlyIncludeMembershipAndNeverExposeUserEntities() throws Exception {
        var group = service.createGroup(me.getUsername(), request(), null);
        for (User member : List.of(me, first, second)) {
            mvc.perform(get("/conversations/groups").with(jwt().jwt(j -> j.subject(member.getUsername()))))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(group.getId().toString()))
                .andExpect(jsonPath("$[0].memberCount").value(3))
                .andExpect(jsonPath("$[0].createdPerson").doesNotExist());
        }
        mvc.perform(get("/conversations/groups").with(jwt().jwt(j -> j.subject(outsider.getUsername()))))
            .andExpect(status().isOk()).andExpect(content().json("[]"));
        mvc.perform(get("/conversations/groups")).andExpect(status().isUnauthorized());
    }

    @Test void multipartCreationPersistsUploadedAvatarAndMembers() throws Exception {
        String url = "https://test.ufs.sh/f/" + "a".repeat(300);
        when(storage.upload(any())).thenReturn(url);
        mvc.perform(multipart("/conversations/groups").file(avatar())
                .file(new MockMultipartFile("group", "", "application/json", json().getBytes(StandardCharsets.UTF_8)))
                .with(jwt().jwt(j -> j.subject(me.getUsername()))).with(csrf()))
            .andExpect(status().isCreated()).andExpect(jsonPath("avatar").value(url))
            .andExpect(jsonPath("memberCount").value(3));
        assertThat(service.getGroups(me.getUsername()).getFirst().getAvatar()).isEqualTo(url);
        verify(storage).upload(any());
    }

    @Test void chatBootstrapIncludesGroupsAndOnlyMembersCanReadAndSend() throws Exception {
        var group = service.createGroup(me.getUsername(), request(), null);
        for (User member : List.of(me, first, second)) {
            mvc.perform(get("/conversations/bootstrap").with(jwt().jwt(j -> j.subject(member.getUsername()))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conversation[0].id").value(group.getId().toString()))
                .andExpect(jsonPath("$.conversation[0].conversationType").value("GROUP"))
                .andExpect(jsonPath("$.conversation[0].name").value("Study group"))
                .andExpect(jsonPath("$.conversation[0].participants.length()").value(3))
                .andExpect(jsonPath("$.conversation[0].participants[0].password").doesNotExist());
        }
        mvc.perform(get("/conversations/bootstrap").with(jwt().jwt(j -> j.subject(outsider.getUsername()))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.conversation.length()").value(0));
        // First and second are not friends; membership is sufficient for group chat.
        mvc.perform(post("/conversations/" + group.getId() + "/messages")
                .with(jwt().jwt(j -> j.subject(first.getUsername()))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Hello group\"}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.senderId").value(first.getId().toString()));
        mvc.perform(get("/conversations/" + group.getId() + "/messages")
                .with(jwt().jwt(j -> j.subject(second.getUsername()))))
            .andExpect(status().isOk()).andExpect(jsonPath("$.items[0].content").value("Hello group"));
        mvc.perform(get("/conversations/" + group.getId() + "/messages")
                .with(jwt().jwt(j -> j.subject(outsider.getUsername()))))
            .andExpect(status().isForbidden());
        mvc.perform(post("/conversations/" + group.getId() + "/messages")
                .with(jwt().jwt(j -> j.subject(outsider.getUsername()))).with(csrf())
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"Denied\"}"))
            .andExpect(status().isForbidden());
    }

    @Test void onlyGroupAdminCanChangeAvatar() throws Exception {
        var group = service.createGroup(me.getUsername(), request(), null);
        for (User denied : List.of(first, outsider)) {
            mvc.perform(multipart(HttpMethod.PUT, "/conversations/groups/" + group.getId() + "/avatar")
                    .file(avatar()).with(jwt().jwt(j -> j.subject(denied.getUsername()))).with(csrf()))
                .andExpect(status().isForbidden());
        }
        verifyNoInteractions(storage);
        when(storage.upload(any())).thenReturn("https://test.ufs.sh/f/new");
        mvc.perform(multipart(HttpMethod.PUT, "/conversations/groups/" + group.getId() + "/avatar")
                .file(avatar()).with(jwt().jwt(j -> j.subject(me.getUsername()))).with(csrf()))
            .andExpect(status().isOk()).andExpect(jsonPath("avatar").value("https://test.ufs.sh/f/new"));
    }

    @Test void jsonStillWorksAndDuplicateMembersAreRejected() throws Exception {
        mvc.perform(post("/conversations/groups").contentType(MediaType.APPLICATION_JSON).content(json())
                .with(jwt().jwt(j -> j.subject(me.getUsername()))).with(csrf()))
            .andExpect(status().isCreated());
        String duplicate = "{\"name\":\"Bad\",\"participantId\":[\"" + first.getId() + "\",\"" + first.getId() + "\"]}";
        mvc.perform(post("/conversations/groups").contentType(MediaType.APPLICATION_JSON).content(duplicate)
                .with(jwt().jwt(j -> j.subject(me.getUsername()))).with(csrf()))
            .andExpect(status().isBadRequest());
    }

    @Test void uploadFailureDoesNotInsertGroup() throws Exception {
        long before = conversations.count();
        when(storage.upload(any())).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "provider details"));
        mvc.perform(multipart("/conversations/groups").file(avatar())
                .file(new MockMultipartFile("group", "", "application/json", json().getBytes(StandardCharsets.UTF_8)))
                .with(jwt().jwt(j -> j.subject(me.getUsername()))).with(csrf()))
            .andExpect(status().isBadGateway()).andExpect(jsonPath("message").value("Đã có lỗi xảy ra. Vui lòng thử lại sau."));
        assertThat(conversations.count()).isEqualTo(before);
    }
}
