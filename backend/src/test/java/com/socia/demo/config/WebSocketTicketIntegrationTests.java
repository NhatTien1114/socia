package com.socia.demo.config;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import java.net.URI;
import java.net.http.*;
import java.time.Instant;
import java.util.concurrent.*;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import com.socia.demo.User.model.User;
import com.socia.demo.User.repository.UserRepository;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "spring.datasource.url=jdbc:h2:mem:ws-ticket;MODE=MySQL;DB_CLOSE_DELAY=-1;NON_KEYWORDS=USER",
    "spring.datasource.driver-class-name=org.h2.Driver", "spring.datasource.username=sa",
    "spring.datasource.password=", "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.show-sql=false", "logging.level.root=WARN", "WS_PUBLIC_BASE_URL=https://backend.example"
})
@AutoConfigureMockMvc
class WebSocketTicketIntegrationTests {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @LocalServerPort int port;

    @Test void csrfProtectedTicketAllowsRealStompHandshakeWithoutCookie() throws Exception {
        mvc.perform(post("/auth/ws-ticket").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/auth/ws-ticket").with(jwt())).andExpect(status().is4xxClientError());
        users.save(User.builder().username("ws-alice").password("test").build());
        var result = mvc.perform(post("/auth/ws-ticket").with(csrf()).with(jwt().jwt(j ->
                    j.subject("ws-alice").expiresAt(Instant.now().plusSeconds(300)))))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andReturn().getResponse().getContentAsString();
        var body = json.readTree(result);
        assertThat(body.path("url").asText()).isEqualTo("https://backend.example/socia/v1/ws");
        String protocol = WebSocketTickets.PREFIX + body.path("ticket").asText();
        var received = new CompletableFuture<String>();
        var client = HttpClient.newHttpClient();
        var socket = client.newWebSocketBuilder().header("Origin", "http://localhost:5173")
                .subprotocols("v12.stomp", protocol)
                .buildAsync(URI.create("ws://localhost:" + port + "/socia/v1/ws"), new WebSocket.Listener() {
                    final StringBuilder text = new StringBuilder();
                    public void onOpen(WebSocket ws) { ws.request(1); }
                    public CompletionStage<?> onText(WebSocket ws, CharSequence data, boolean last) {
                        text.append(data);
                        if (last) received.complete(text.toString());
                        ws.request(1);
                        return null;
                    }
                    public void onError(WebSocket ws, Throwable error) { received.completeExceptionally(error); }
                }).get(10, TimeUnit.SECONDS);
        try {
            socket.sendText("CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\u0000", true).join();
            assertThat(received.get(10, TimeUnit.SECONDS)).startsWith("CONNECTED");
            assertThatThrownBy(() -> client.newWebSocketBuilder().header("Origin", "http://localhost:5173")
                    .subprotocols("v12.stomp", protocol)
                    .buildAsync(URI.create("ws://localhost:" + port + "/socia/v1/ws"), new WebSocket.Listener() {})
                    .get(10, TimeUnit.SECONDS)).hasCauseInstanceOf(WebSocketHandshakeException.class);
        } finally { socket.abort(); client.close(); }
    }
}
