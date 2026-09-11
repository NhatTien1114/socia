package com.socia.demo.Message.service;

import org.springframework.stereotype.Service;

import com.socia.demo.Message.repository.MessageRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MessageService {
    private final MessageRepository messageRepository;

}
