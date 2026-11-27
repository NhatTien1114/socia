package com.socia.demo.Message.model;

import java.util.UUID;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor
public class MessageImage {
    @Id
    private UUID id;

    @MapsId
    @OneToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "message_id")
    private Message message;

    @Lob
    @Column(nullable = false, length = 16_777_215)
    private byte[] data;

    public MessageImage(Message message, byte[] data) {
        this.message = message;
        this.data = data;
    }
}
