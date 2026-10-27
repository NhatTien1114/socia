package com.socia.demo.config;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.*;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.socket.*;
import org.springframework.web.socket.config.annotation.*;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final String origin;
    private final org.springframework.scheduling.TaskScheduler heartbeat;
    private final Map<String, ScheduledFuture<?>> expiryTasks = new ConcurrentHashMap<>();
    private final ScheduledExecutorService scheduler = Executors.newSingleThreadScheduledExecutor(task -> {
        Thread thread = new Thread(task, "socia-websocket-expiry");
        thread.setDaemon(true);
        return thread;
    });

    public WebSocketConfig(@Value("${app.frontend-origin:http://localhost:5173}") String origin,
            @org.springframework.beans.factory.annotation.Qualifier("presenceHeartbeatScheduler") org.springframework.scheduling.TaskScheduler heartbeat) {
        this.heartbeat = heartbeat;
        this.origin = origin;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws").setAllowedOrigins(origin);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue").setTaskScheduler(heartbeat).setHeartbeatValue(new long[] {10000, 10000});
        registry.setUserDestinationPrefix("/user");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                var accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor == null)
                    throw new AccessDeniedException("Frame không hợp lệ.");
                var command = accessor.getCommand();
                if (command == StompCommand.DISCONNECT)
                    return message;
                if (!(accessor.getUser() instanceof JwtAuthenticationToken auth)
                        || auth.getToken().getExpiresAt() == null
                        || !auth.getToken().getExpiresAt().isAfter(Instant.now())) {
                    throw new AccessDeniedException("Phiên đăng nhập đã hết hạn.");
                }
                if (command == null || command == StompCommand.CONNECT || command == StompCommand.UNSUBSCRIBE) {
                    return message;
                }
                if (command == StompCommand.SUBSCRIBE
                        && accessor.getDestination() != null
                        && java.util.Set.of("/user/queue/messages", "/user/queue/read-receipts", "/user/queue/presence").contains(accessor.getDestination()))
                    return message;
                throw new AccessDeniedException("Thao tác không được phép.");
            }
        });
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.addDecoratorFactory(handler -> new WebSocketHandlerDecorator(handler) {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                if (!(session.getPrincipal() instanceof JwtAuthenticationToken auth)
                        || auth.getToken().getExpiresAt() == null
                        || !auth.getToken().getExpiresAt().isAfter(Instant.now())) {
                    session.close(CloseStatus.POLICY_VIOLATION);
                    return;
                }
                super.afterConnectionEstablished(session);
                long delay = Math.max(0, Duration.between(Instant.now(), auth.getToken().getExpiresAt()).toMillis());
                expiryTasks.put(session.getId(), scheduler.schedule(() -> {
                    expiryTasks.remove(session.getId());
                    try {
                        session.close(CloseStatus.POLICY_VIOLATION);
                    } catch (java.io.IOException ignored) {
                    }
                }, delay, TimeUnit.MILLISECONDS));
            }

            @Override
            public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
                var task = expiryTasks.remove(session.getId());
                if (task != null)
                    task.cancel(false);
                super.afterConnectionClosed(session, status);
            }
        });
    }

    @PreDestroy
    public void shutdown() {
        scheduler.shutdownNow();
    }
}
