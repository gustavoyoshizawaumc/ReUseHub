package com.reusehub.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;

@SpringBootApplication
@ComponentScan(basePackages = "com.reusehub")
@EnableJpaRepositories(basePackages = {
    "com.reusehub.anuncio.repository",
    "com.reusehub.auth.repository"
})
@EntityScan(basePackages = {
    "com.reusehub.anuncio.model",
    "com.reusehub.auth.model"
})
@EnableMongoRepositories(basePackages = "com.reusehub.chat.repository")
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}