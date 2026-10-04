package com.socia.demo.User;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.nio.charset.StandardCharsets;
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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.web.server.ResponseStatusException;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.UserRepository;
import com.socia.demo.User.service.UploadThingStorage;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:profile-tests;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.hibernate.ddl-auto=create-drop", "spring.sql.init.mode=never"
})
@AutoConfigureMockMvc
class ProfileIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired UserRepository users;
    @MockitoBean UploadThingStorage storage;
    User me;
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @BeforeEach void setup() {
        me = users.save(User.builder().username("profile-" + UUID.randomUUID())
                .password(encoder.encode("Original123!" )).avatar("https://test.ufs.sh/f/old").build());
    }
    RequestPostProcessor authenticated() { return jwt().jwt(builder -> builder.subject(me.getUsername())); }
    MockMultipartFile profile(String json) {
        return new MockMultipartFile("profile", "profile.json", "application/json", json.getBytes(StandardCharsets.UTF_8));
    }
    String validProfile = """
        {"displayName":"Nguyễn An","phone":"0912345678","sex":"FEMALE","birthDate":"2000-08-14"}
        """;

    @Test void profileRequiresAuthenticationAndNeverLeaksPassword() throws Exception {
        mvc.perform(get("/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/users/me").with(authenticated())).andExpect(status().isOk())
                .andExpect(jsonPath("username").value(me.getUsername()))
                .andExpect(jsonPath("displayName").value(me.getUsername()))
                .andExpect(jsonPath("password").doesNotExist());
    }
    @Test void savesPersonalDetailsWithoutChangingLoginOrUploading() throws Exception {
        mvc.perform(multipart(HttpMethod.PUT, "/users/me").file(profile(validProfile)).with(authenticated()))
                .andExpect(status().isOk()).andExpect(jsonPath("displayName").value("Nguyễn An"))
                .andExpect(jsonPath("birthDate").value("2000-08-14"));
        User saved = users.findById(me.getId()).orElseThrow();
        assertThat(saved.getUsername()).isEqualTo(me.getUsername());
        assertThat(saved.getPassword()).isEqualTo(me.getPassword());
        assertThat(saved.getAvatar()).isEqualTo(me.getAvatar());
        verifyNoInteractions(storage);
        mvc.perform(get("/conversations/bootstrap").with(authenticated())).andExpect(status().isOk())
                .andExpect(jsonPath("me.displayName").value("Nguyễn An"));
    }
    @Test void storesOnlyTheProviderUrlAndPreservesOtherAccounts() throws Exception {
        User other = users.save(User.builder().username("other-" + UUID.randomUUID()).displayName("Other").build());
        when(storage.upload(any())).thenReturn("https://app.ufs.sh/f/new-photo");
        mvc.perform(multipart(HttpMethod.PUT, "/users/me").file(profile(validProfile))
                .file(new MockMultipartFile("avatar", "photo.png", "image/png", new byte[]{1}))
                .with(authenticated())).andExpect(status().isOk())
                .andExpect(jsonPath("avatar").value("https://app.ufs.sh/f/new-photo"));
        assertThat(users.findById(me.getId()).orElseThrow().getAvatar()).isEqualTo("https://app.ufs.sh/f/new-photo");
        assertThat(users.findById(other.getId()).orElseThrow().getDisplayName()).isEqualTo("Other");
    }
    @Test void uploadFailureDoesNotSaveAnyProfileChanges() throws Exception {
        when(storage.upload(any())).thenThrow(new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Upload failed"));
        mvc.perform(multipart(HttpMethod.PUT, "/users/me").file(profile(validProfile))
                .file(new MockMultipartFile("avatar", "photo.png", "image/png", new byte[]{1}))
                .with(authenticated())).andExpect(status().isBadGateway());
        User unchanged = users.findById(me.getId()).orElseThrow();
        assertThat(unchanged.getAvatar()).isEqualTo(me.getAvatar());
        assertThat(unchanged.getDisplayName()).isNull();
    }
    @Test void rejectsInvalidNamePhoneAndFutureDateBeforeUploading() throws Exception {
        for (String invalid : new String[]{ validProfile.replace("Nguyễn An", "   "),
                validProfile.replace("0912345678", "invalid"), validProfile.replace("2000-08-14", "2999-01-01"),
                validProfile.replace("2000-08-14", "2000-02-30") }) {
            mvc.perform(multipart(HttpMethod.PUT, "/users/me").file(profile(invalid)).with(authenticated()))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(storage);
    }
    @Test void passwordRequiresCorrectOldPasswordAndIsStoredAsHash() throws Exception {
        mvc.perform(post("/users/change-password").with(authenticated()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"oldPassword\":\"wrong\",\"newPassword\":\"Changed123!\"}"))
                .andExpect(status().isBadRequest());
        assertThat(users.findById(me.getId()).orElseThrow().getPassword()).isEqualTo(me.getPassword());
        mvc.perform(post("/users/change-password").with(authenticated()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"oldPassword\":\"Original123!\",\"newPassword\":\"Changed123!\"}"))
                .andExpect(status().isNoContent());
        String hash = users.findById(me.getId()).orElseThrow().getPassword();
        assertThat(hash).isNotEqualTo("Changed123!");
        assertThat(encoder.matches("Changed123!", hash)).isTrue();
        assertThat(encoder.matches("Original123!", hash)).isFalse();
    }
    @Test void rejectsWeakSameAndOverlongPasswordsAndQueryParameters() throws Exception {
        for (String password : new String[]{"short", "Original123!", "a".repeat(73), "á".repeat(37)}) {
            mvc.perform(post("/users/change-password").with(authenticated()).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"oldPassword\":\"Original123!\",\"newPassword\":\"" + password + "\"}"))
                    .andExpect(status().isBadRequest());
        }
        mvc.perform(post("/users/change-password").with(authenticated())
                .param("oldPassword", "Original123!").param("newPassword", "Changed123!"))
                .andExpect(status().is4xxClientError());
    }
    @Test void regularUserCannotBypassPasswordCheckThroughLegacyCrud() throws Exception {
        mvc.perform(put("/users/" + me.getId()).with(authenticated()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"password\":\"Bypass123!\"}")).andExpect(status().isForbidden());
        mvc.perform(delete("/users/" + me.getId()).with(authenticated())).andExpect(status().isForbidden());
        mvc.perform(post("/users").with(authenticated()).contentType(MediaType.APPLICATION_JSON)
                .content("{\"username\":\"injected\"}")).andExpect(status().isForbidden());
    }
}
