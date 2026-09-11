package com.socia.demo.Message.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.socia.demo.Message.model.Message;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

}
