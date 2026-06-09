package com.reusehub.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@ComponentScan(basePackages = "com.reusehub")
@EnableJpaRepositories(basePackages = {
    "com.reusehub.anuncio.repository",
    "com.reusehub.anuncio.visualizacao.repository",
    "com.reusehub.auth.repository",
    "com.reusehub.interesse.repository",
    "com.reusehub.avaliacao.repository",
    "com.reusehub.notificacao.repository",
    "com.reusehub.denuncia.repository",
    "com.reusehub.moderacao.repository"
})
@EntityScan(basePackages = {
    "com.reusehub.anuncio.model",
    "com.reusehub.anuncio.visualizacao.model",
    "com.reusehub.auth.model",
    "com.reusehub.interesse.model",
    "com.reusehub.avaliacao.model",
    "com.reusehub.notificacao.model",
    "com.reusehub.denuncia.model",
    "com.reusehub.moderacao.model"
})
@EnableMongoRepositories(basePackages = "com.reusehub.chat.repository")
public class BackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }
}
