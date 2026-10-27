package com.socia.demo.Message.controller;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionalEventListener;
import lombok.RequiredArgsConstructor;
import com.socia.demo.Common.UserQueuePublisher;
import com.socia.demo.Message.service.MessageReadService;
@Component @RequiredArgsConstructor
public class MessageReadListener {
    private final UserQueuePublisher publisher;
    @TransactionalEventListener public void saved(MessageReadService.Saved event) {
        publisher.send(event.usernames(), "/queue/read-receipts", event.batch());
    }
}
