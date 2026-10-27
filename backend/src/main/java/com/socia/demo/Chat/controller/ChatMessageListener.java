package com.socia.demo.Chat.controller;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import com.socia.demo.Common.UserQueuePublisher;
import com.socia.demo.Message.dtos.response.MessageSavedResponse;
import lombok.RequiredArgsConstructor;
@Component @RequiredArgsConstructor
public class ChatMessageListener {
 private final UserQueuePublisher publisher;
 @TransactionalEventListener
 public void onMessageSaved(MessageSavedResponse event) {
  publisher.send(event.getUsernames(), "/queue/messages", event.getMessage());
 }
}
