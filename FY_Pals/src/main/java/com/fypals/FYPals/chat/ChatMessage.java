package com.fypals.FYPals.chat;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChatMessage {
    private Long teamId;
    private Long senderId;
    private String senderName;
    private String content;
    private String messageType; // TEXT, DISPUTE_REQUEST, POLL
    private LocalDateTime timestamp;
}