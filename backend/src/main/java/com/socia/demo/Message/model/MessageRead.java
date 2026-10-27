package com.socia.demo.Message.model;
import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.*;
import lombok.*;
import com.socia.demo.User.model.User;
@Entity @Table(name="message_reads", uniqueConstraints=@UniqueConstraint(columnNames={"message_id","user_id"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MessageRead {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="message_id", nullable=false) private Message message;
    @ManyToOne(fetch=FetchType.LAZY, optional=false) @JoinColumn(name="user_id", nullable=false) private User user;
    @Column(name="read_at", nullable=false, updatable=false) private Instant readAt;
}
