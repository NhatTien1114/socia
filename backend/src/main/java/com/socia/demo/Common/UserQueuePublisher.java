package com.socia.demo.Common;
import java.util.Collection;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
@Component @RequiredArgsConstructor @Slf4j
public class UserQueuePublisher {
    private final SimpMessagingTemplate messaging;
    public void send(Collection<String> usernames, String queue, Object payload) {
        for (String username : usernames) {
            try { messaging.convertAndSendToUser(username, queue, payload); }
            catch (MessagingException ex) { log.warn("Cannot publish to {}; REST can recover state", queue, ex); }
        }
    }
}
