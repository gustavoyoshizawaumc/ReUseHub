package com.reusehub.admin.service;

import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrapRunner implements ApplicationRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${admin.bootstrap.email:}")
    private String bootstrapEmail;

    @Value("${admin.bootstrap.password:}")
    private String bootstrapPassword;

    @Value("${admin.bootstrap.name:Administrador}")
    private String bootstrapName;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = SensitiveDataCrypto.normalizarEmail(bootstrapEmail);

        if (email == null || bootstrapPassword == null || bootstrapPassword.isBlank()) {
            return;
        }

        if (usuarioRepository.existsByEmail(email)) {
            Usuario admin = usuarioRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalStateException("Administrador bootstrap existente nao foi encontrado."));
            garantirAdminRaizAtivo(admin);
            log.info("Bootstrap de administrador validado para {}.", email);
            return;
        }

        Usuario admin = Usuario.builder()
                .name(nomeBootstrap())
                .email(email)
                .cpf(gerarCpfTecnico())
                .passwordHash(passwordEncoder.encode(bootstrapPassword))
                .perfil(Perfil.ADMIN)
                .isActive(true)
                .banido(false)
                .contaExcluida(false)
                .isVerified(true)
                .lgpdConsent(true)
                .lgpdConsentAt(LocalDateTime.now())
                .build();

        usuarioRepository.save(admin);
        log.info("Conta ADMIN criada pelo bootstrap para {}.", email);
    }

    private void garantirAdminRaizAtivo(Usuario admin) {
        boolean alterado = false;

        if (admin.getPerfil() != Perfil.ADMIN) {
            admin.setPerfil(Perfil.ADMIN);
            alterado = true;
        }
        if (!Boolean.TRUE.equals(admin.getIsActive())) {
            admin.setIsActive(true);
            alterado = true;
        }
        if (Boolean.TRUE.equals(admin.getBanido())) {
            admin.setBanido(false);
            alterado = true;
        }
        if (Boolean.TRUE.equals(admin.getContaExcluida())) {
            admin.setContaExcluida(false);
            alterado = true;
        }
        if (!Boolean.TRUE.equals(admin.getIsVerified())) {
            admin.setIsVerified(true);
            alterado = true;
        }
        if (!Boolean.TRUE.equals(admin.getLgpdConsent())) {
            admin.setLgpdConsent(true);
            admin.setLgpdConsentAt(LocalDateTime.now());
            alterado = true;
        }
        if (admin.getDesativadoEm() != null || admin.getExcluidoEm() != null) {
            admin.setDesativadoEm(null);
            admin.setExcluidoEm(null);
            alterado = true;
        }

        if (alterado) {
            usuarioRepository.save(admin);
            log.warn("Conta ADMIN raiz foi restaurada para estado ativo e protegido.");
        }
    }

    private String nomeBootstrap() {
        return bootstrapName == null || bootstrapName.isBlank() ? "Administrador" : bootstrapName.trim();
    }

    private String gerarCpfTecnico() {
        String cpf;
        do {
            cpf = String.format("9%010d", Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 10_000_000_000L));
        } while (usuarioRepository.existsByCpf(cpf));
        return cpf;
    }
}
