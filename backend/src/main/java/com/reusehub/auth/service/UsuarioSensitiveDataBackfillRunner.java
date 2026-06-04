package com.reusehub.auth.service;

import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Component
@RequiredArgsConstructor
public class UsuarioSensitiveDataBackfillRunner implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Usuario> pendentes = usuarioRepository.findAll().stream()
                .filter(this::precisaAtualizar)
                .toList();

        if (!pendentes.isEmpty()) {
            usuarioRepository.saveAll(pendentes);
        }
    }

    private boolean precisaAtualizar(Usuario usuario) {
        return usuario.getEmailHash() == null
                || usuario.getEmailHash().isBlank()
                || usuario.getCpfHash() == null
                || usuario.getCpfHash().isBlank();
    }
}
