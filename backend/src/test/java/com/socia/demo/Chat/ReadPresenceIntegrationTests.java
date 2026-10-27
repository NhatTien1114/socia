package com.socia.demo.Chat;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.util.*;
import java.util.concurrent.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.server.ResponseStatusException;
import com.socia.demo.Chat.service.ChatService;
import com.socia.demo.Common.UserQueuePublisher;
import com.socia.demo.Enum.FriendRequestStatus;
import com.socia.demo.Message.repository.MessageReadRepository;
import com.socia.demo.Message.service.MessageReadService;
import com.socia.demo.Presence.PresenceService;
import com.socia.demo.User.model.*;
import com.socia.demo.User.repository.*;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:read-presence-tests;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never",
    "spring.jpa.show-sql=false", "logging.level.root=WARN"
})
@AutoConfigureMockMvc
class ReadPresenceIntegrationTests {
    @Autowired com.socia.demo.Conversation.service.ConversationService groups;
    @Autowired ChatService chat;
    @Autowired MessageReadService reads;
    @Autowired MessageReadRepository receipts;
    @Autowired PresenceService presence;
    @Autowired UserRepository users;
    @Autowired FriendRequestRepository friends;
    @Autowired MockMvc mvc;
    @MockitoBean UserQueuePublisher publisher;
    User alice, bob, outsider;
    UUID room, message;

    User user() { return users.save(User.builder().username(UUID.randomUUID().toString()).password("test").build()); }
    @BeforeEach void setup() {
        alice = user(); bob = user(); outsider = user();
        friends.save(FriendRequest.builder().sender(alice).receiver(bob).status(FriendRequestStatus.ACCEPTED).build());
        room = chat.openDirect(alice.getUsername(), bob.getId()).getId();
        message = chat.send(alice.getUsername(), room, "Hello").getId();
        clearInvocations(publisher);
    }
    @Test void repeatedReadsKeepFirstTimestampAndHistoryRestoresThem() {
        assertThat(chat.history(bob.getUsername(), room, null, 30).getItems().getFirst().getReads()).isEmpty();
        var first = reads.mark(bob.getUsername(), room, List.of(message, message));
        var second = reads.mark(bob.getUsername(), room, List.of(message));
        assertThat(second).isEqualTo(first);
        assertThat(first.reads()).hasSize(1);
        assertThat(first.reads().getFirst().readerId()).isEqualTo(bob.getId());
        assertThat(chat.history(alice.getUsername(), room, null, 30).getItems().getFirst().getReads()).isEqualTo(first.reads());
        assertThat(reads.mark(alice.getUsername(), room, List.of(message)).reads()).isEmpty();
        verify(publisher, times(1)).send(argThat(names -> names.containsAll(List.of(alice.getUsername(), bob.getUsername()))),
            eq("/queue/read-receipts"), eq(first));
    }
    @Test void foreignAndMissingMessagesRejectEntireBatch() {
        friends.save(FriendRequest.builder().sender(alice).receiver(outsider).status(FriendRequestStatus.ACCEPTED).build());
        var other = chat.openDirect(alice.getUsername(), outsider.getId());
        var foreign = chat.send(alice.getUsername(), other.getId(), "Private");
        assertThatThrownBy(() -> reads.mark(bob.getUsername(), room, List.of(message, foreign.getId())))
            .isInstanceOf(ResponseStatusException.class);
        assertThatThrownBy(() -> reads.mark(bob.getUsername(), room, List.of(message, UUID.randomUUID())))
            .isInstanceOf(ResponseStatusException.class);
        assertThat(receipts.findByMessageIdIn(List.of(message))).isEmpty();
        verify(publisher, never()).send(any(), eq("/queue/read-receipts"), any());
    }
    @Test void endpointsEnforceMembershipValidationAndAuthentication() throws Exception {
        String path = "/conversations/" + room + "/reads";
        String body = "{\"messageIds\":[\"" + message + "\"]}";
        mvc.perform(post(path).with(jwt().jwt(j -> j.subject(outsider.getUsername()))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isForbidden());
        mvc.perform(post(path).with(jwt().jwt(j -> j.subject(bob.getUsername()))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"messageIds\":[]}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).with(jwt().jwt(j -> j.subject(bob.getUsername()))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content("{\"messageIds\":[null]}")).andExpect(status().isBadRequest());
        mvc.perform(post(path).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isUnauthorized());
        mvc.perform(get("/presence")).andExpect(status().isUnauthorized());
        mvc.perform(post(path).with(jwt().jwt(j -> j.subject(bob.getUsername()))).with(csrf())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk())
            .andExpect(jsonPath("$.reads[0].readerId").value(bob.getId().toString()));
    }
    @Test void concurrentTabsCreateExactlyOneReceipt() throws Exception {
        try (var executor = Executors.newFixedThreadPool(2)) {
            var ready = new CountDownLatch(2);
            Callable<Object> request = () -> {
                ready.countDown();
                if (!ready.await(5, TimeUnit.SECONDS)) throw new AssertionError("Start timeout");
                return reads.mark(bob.getUsername(), room, List.of(message));
            };
            var a = executor.submit(request); var b = executor.submit(request);
            assertThat(a.get(10, TimeUnit.SECONDS)).isEqualTo(b.get(10, TimeUnit.SECONDS));
        }
        assertThat(receipts.findByMessageIdIn(List.of(message))).hasSize(1);
        verify(publisher, times(1)).send(any(), eq("/queue/read-receipts"), any());
    }
    @Test void presenceCountsTabsAndOnlyPublishesFirstAndLastTransitions() {
        String a = UUID.randomUUID().toString(), b = UUID.randomUUID().toString();
        try {
            presence.connected(a, bob.getUsername()); presence.connected(a, bob.getUsername());
            presence.connected(b, bob.getUsername());
            var online = presence.snapshot(alice.getUsername()).getFirst();
            assertThat(online.online()).isTrue();
            presence.disconnected(a); presence.disconnected(a);
            assertThat(presence.snapshot(alice.getUsername()).getFirst()).isEqualTo(online);
            presence.disconnected(b);
            var offline = presence.snapshot(alice.getUsername()).getFirst();
            assertThat(offline.online()).isFalse();
            assertThat(offline.lastSeenAt()).isNotNull();
            assertThat(offline.version()).isEqualTo(online.version() + 1);
            assertThat(offline.epoch()).isEqualTo(online.epoch());
            verify(publisher, times(2)).send(argThat(names -> names.size() == 1 && names.contains(alice.getUsername())), eq("/queue/presence"), any());
        } finally { presence.disconnected(a); presence.disconnected(b); }
    }
    @Test void groupReceiptsCountDistinctReadersAndPresenceIncludesNonFriendMembers() {
        friends.save(FriendRequest.builder().sender(alice).receiver(outsider).status(FriendRequestStatus.ACCEPTED).build());
        var group = groups.createGroup(alice.getUsername(),
            com.socia.demo.Conversation.dtos.request.ConversationGroupRequest.builder()
                .name("Group").participantId(List.of(bob.getId(), outsider.getId())).build(), null);
        var sent = chat.send(bob.getUsername(), group.getId(), "Group message");
        reads.mark(alice.getUsername(), group.getId(), List.of(sent.getId()));
        reads.mark(outsider.getUsername(), group.getId(), List.of(sent.getId()));
        reads.mark(outsider.getUsername(), group.getId(), List.of(sent.getId()));
        assertThat(chat.history(bob.getUsername(), group.getId(), null, 30).getItems().getFirst().getReads())
            .extracting(r -> r.readerId()).containsExactlyInAnyOrder(alice.getId(), outsider.getId());
        assertThat(presence.snapshot(bob.getUsername())).extracting(PresenceService.State::userId)
            .containsExactlyInAnyOrder(alice.getId(), outsider.getId());
    }

    @Test void unrelatedUsersCannotSeePresence() {
        assertThat(presence.snapshot(outsider.getUsername())).isEmpty();
        assertThat(presence.snapshot(alice.getUsername())).extracting(PresenceService.State::userId).containsExactly(bob.getId());
    }
}
