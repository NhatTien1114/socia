package com.socia.demo.Message.dtos.response;
import java.util.*;
public record ReadReceiptBatch(UUID conversationId, List<MessageReadResponse> reads) {}
