package com.socia.demo.Chat.controller;

import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import com.socia.demo.Message.dtos.response.MessageSavedResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class ChatMessageListener {

    private final SimpMessagingTemplate messagingTemplate;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onMessageSaved(MessageSavedResponse event) {
        for (String username : event.getUsernames()) {
            try {
                messagingTemplate.convertAndSendToUser(
                        username,
                        "/queue/messages",
                        event.getMessage());
            } catch (MessagingException exception) {
                // Tin đã lưu. Client có thể lấy lại qua REST.
                log.warn(
                        "Không thể đẩy message {} qua WebSocket.",
                        event.getMessage().getId(),
                        exception);
            }
        }
    }
}
