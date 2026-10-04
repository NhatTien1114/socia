package com.socia.demo.config;

import java.time.Instant;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
    private final CustomJwtDecoder customJwtDecoder;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/queue");
        registry.setUserDestinationPrefix("/user");
        registry.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void configureClientInboundChannel(
            ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {

            @Override
            public Message<?> preSend(
                    Message<?> message,
                    MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(
                        message,
                        StompHeaderAccessor.class);

                if (accessor == null) {
                    throw new AccessDeniedException("Frame không hợp lệ.");
                }

                StompCommand command = accessor.getCommand();

                // Heartbeat không có STOMP command.
                if (command == null) {
                    return message;
                }

                if (command == StompCommand.CONNECT) {
                    String authorization = accessor.getFirstNativeHeader("Authorization");

                    if (authorization == null
                            || !authorization.startsWith("Bearer ")) {
                        throw new AccessDeniedException("Thiếu JWT.");
                    }

                    var jwt = customJwtDecoder.decode(authorization.substring(7));

                    // getName() của authentication này là JWT subject = username.
                    accessor.setUser(new JwtAuthenticationToken(jwt));
                    return message;
                }

                if (command == StompCommand.DISCONNECT) {
                    return message;
                }

                if (!(accessor.getUser() instanceof JwtAuthenticationToken auth)) {
                    throw new AccessDeniedException("Chưa xác thực.");
                }

                Instant expiresAt = auth.getToken().getExpiresAt();

                if (expiresAt == null || !expiresAt.isAfter(Instant.now())) {
                    throw new AccessDeniedException("JWT đã hết hạn.");
                }

                if (command == StompCommand.SUBSCRIBE
                        && "/user/queue/messages".equals(accessor.getDestination())) {
                    return message;
                }

                if (command == StompCommand.UNSUBSCRIBE) {
                    return message;
                }

                // Gửi tin qua REST; không cho client SEND trực tiếp vào broker
                // hoặc SUBSCRIBE vào queue của người khác.
                throw new AccessDeniedException("Thao tác không được phép.");
            }
        });
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOrigins("http://localhost:5173");
    }

}
