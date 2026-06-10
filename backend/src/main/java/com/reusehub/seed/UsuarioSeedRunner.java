package com.reusehub.seed;

import com.reusehub.auth.crypto.SensitiveDataCrypto;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Slf4j
@Component
@Profile("seed")
@RequiredArgsConstructor
public class UsuarioSeedRunner implements ApplicationRunner {

    private static final int TAMANHO_LOTE = 200;

    private static final long BASE_CPF_USUARIOS = 700_000_000L;
    private static final long BASE_CPF_MODERADOR = 999_000_000L;
    private static final String[] NOMES = {
            "Ana", "Bruno", "Camila", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique",
            "Isabela", "Joao", "Karen", "Lucas", "Mariana", "Nicolas", "Olivia", "Pedro",
            "Quezia", "Rafael", "Sabrina", "Thiago", "Ursula", "Vinicius", "Wesley", "Yasmin",
            "Beatriz", "Caio", "Debora", "Enzo", "Fernanda", "Gustavo", "Helena", "Igor"
    };
    private static final String[] SOBRENOMES = {
            "Almeida", "Alves", "Araujo", "Barbosa", "Batista", "Campos", "Cardoso", "Carvalho",
            "Castro", "Costa", "Dias", "Ferreira", "Gomes", "Lima", "Lopes", "Machado",
            "Martins", "Melo", "Mendes", "Monteiro", "Moreira", "Nascimento", "Oliveira",
            "Pereira", "Ribeiro", "Rocha", "Santana", "Santos", "Silva", "Souza", "Teixeira",
            "Vieira"
    };

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${seed.usuarios.total:1000}")
    private int total;

    @Value("${seed.usuarios.anunciantes:320}")
    private int anunciantes;

    @Value("${seed.usuarios.senha:Senha@123}")
    private String senha;

    @Value("${seed.usuarios.dominio:seed.reusehub}")
    private String dominio;

    @Value("${seed.moderador.criar:true}")
    private boolean criarModerador;

    @Value("${seed.moderador.email:moderador@seed.reusehub}")
    private String moderadorEmail;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedarModerador();
        seedarUsuarios();
    }

    private void seedarUsuarios() {
        String primeiroEmail = emailDoIndice(1);
        if (usuarioRepository.existsByEmail(primeiroEmail)) {
            log.info("[seed] Usuarios ja semeados ({} existe). Pulando.", primeiroEmail);
            return;
        }

        String hashSenha = passwordEncoder.encode(senha);

        log.info("[seed] Criando {} usuarios USUARIO (dominio @{}, {} marcados como anunciantes por convencao)...",
                total, dominio, Math.min(anunciantes, total));

        List<Usuario> lote = new ArrayList<>(TAMANHO_LOTE);
        int criados = 0;

        for (int i = 1; i <= total; i++) {
            lote.add(construirUsuario(i, hashSenha));

            if (lote.size() == TAMANHO_LOTE) {
                usuarioRepository.saveAll(lote);
                criados += lote.size();
                lote.clear();
                log.info("[seed] ...{}/{} usuarios persistidos.", criados, total);
            }
        }
        if (!lote.isEmpty()) {
            usuarioRepository.saveAll(lote);
            criados += lote.size();
        }

        log.info("[seed] Concluido: {} usuarios criados. Login: {} / senha: '{}'. "
                        + "Anunciantes (peca 2): {}..{}.",
                criados, emailDoIndice(1), senha, emailDoIndice(1), emailDoIndice(Math.min(anunciantes, total)));
    }

    private Usuario construirUsuario(int indice, String hashSenha) {
        String nome = nomeDoIndice(indice);
        return Usuario.builder()
                .name(nome)
                .email(emailDoIndice(indice))
                .cpf(gerarCpfValido(BASE_CPF_USUARIOS + indice))
                .passwordHash(hashSenha)
                .phone(telefoneDoIndice(indice))
                .perfil(Perfil.USUARIO)
                .isActive(true)
                .banido(false)
                .contaExcluida(false)
                .isVerified(true)
                .lgpdConsent(true)
                .lgpdConsentAt(LocalDateTime.now())
                .build();
    }

    private void seedarModerador() {
        if (!criarModerador) {
            return;
        }
        String email = SensitiveDataCrypto.normalizarEmail(moderadorEmail);
        if (email == null || usuarioRepository.existsByEmail(email)) {
            log.info("[seed] Moderador ignorado (ja existe ou email vazio): {}", moderadorEmail);
            return;
        }

        Usuario moderador = Usuario.builder()
                .name("Moderador Seed")
                .email(email)
                .cpf(gerarCpfValido(BASE_CPF_MODERADOR + 1))
                .passwordHash(passwordEncoder.encode(senha))
                .phone("1199" + String.format("%07d", 0))
                .perfil(Perfil.MODERADOR)
                .isActive(true)
                .banido(false)
                .contaExcluida(false)
                .isVerified(true)
                .lgpdConsent(true)
                .lgpdConsentAt(LocalDateTime.now())
                .build();

        usuarioRepository.save(moderador);
        log.info("[seed] MODERADOR criado: {} / senha: '{}'.", email, senha);
    }

    private String emailDoIndice(int indice) {
        return String.format("%s.%04d@%s", slugDoNome(nomeDoIndice(indice)), indice, dominio);
    }

    private String nomeDoIndice(int indice) {
        int base = Math.max(0, indice - 1);
        String primeiroNome = NOMES[base % NOMES.length];
        int combinacaoSobrenome = base / NOMES.length;
        String sobrenomeUm = SOBRENOMES[combinacaoSobrenome % SOBRENOMES.length];
        String sobrenomeDois = SOBRENOMES[(combinacaoSobrenome / SOBRENOMES.length) % SOBRENOMES.length];
        if (sobrenomeUm.equals(sobrenomeDois)) {
            sobrenomeDois = SOBRENOMES[(combinacaoSobrenome + indice) % SOBRENOMES.length];
        }
        return primeiroNome + " " + sobrenomeUm + " " + sobrenomeDois;
    }

    private String slugDoNome(String nome) {
        String normalizado = Normalizer.normalize(nome, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .toLowerCase(Locale.ROOT);
        return normalizado
                .replaceAll("[^a-z0-9]+", ".")
                .replaceAll("(^\\.|\\.$)", "");
    }

    private String telefoneDoIndice(int indice) {
        return "119" + String.format("%08d", indice);
    }

    static String gerarCpfValido(long base9Digitos) {
        String base = String.format("%09d", Math.floorMod(base9Digitos, 1_000_000_000L));
        int d1 = digitoVerificador(base, 10);
        String comD1 = base + d1;
        int d2 = digitoVerificador(comD1, 11);
        return comD1 + d2;
    }

    private static int digitoVerificador(String digitos, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < digitos.length(); i++) {
            soma += (digitos.charAt(i) - '0') * (pesoInicial - i);
        }
        int resto = soma % 11;
        return (resto < 2) ? 0 : (11 - resto);
    }
}
