package com.socia.demo.config;
import org.springframework.context.annotation.*;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
@Configuration
public class HeartbeatConfig {
    @Bean public ThreadPoolTaskScheduler presenceHeartbeatScheduler() {
        var scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("socia-heartbeat-");
        return scheduler;
    }
}
