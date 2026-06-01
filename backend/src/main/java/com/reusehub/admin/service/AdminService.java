package com.reusehub.admin.service;

import com.reusehub.admin.dto.AdminCriarModeradorDTO;
import com.reusehub.admin.dto.AdminDashboardDTO;
import com.reusehub.admin.dto.AdminUsuarioDTO;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.denuncia.model.DenunciaAnuncio;
import com.reusehub.denuncia.repository.DenunciaAnuncioRepository;
import com.reusehub.moderacao.dto.HistoricoModeracaoDTO;
import com.reusehub.moderacao.model.HistoricoModeracao;
import com.reusehub.moderacao.repository.HistoricoModeracaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

    private static final LocalDateTime INICIO_FILTRO = LocalDate.of(1900, 1, 1).atStartOfDay();
    private static final LocalDateTime FIM_FILTRO = LocalDate.of(9999, 12, 31).atStartOfDay();
    private static final UUID UUID_SENTINELA = new UUID(0, 0);

    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final DenunciaAnuncioRepository denunciaRepository;
    private final HistoricoModeracaoRepository historicoRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminUsuarioDTO criarContaInterna(AdminCriarModeradorDTO dto, Perfil perfilPadrao) {
        if (usuarioRepository.existsByEmail(dto.email())) {
            throw new IllegalArgumentException("E-mail ja cadastrado.");
        }

        Perfil perfil = dto.perfil() != null ? dto.perfil() : perfilPadrao;
        if (perfil == Perfil.USUARIO) {
            perfil = Perfil.MODERADOR;
        }

        Usuario usuario = Usuario.builder()
                .name(dto.name())
                .cpf(gerarCpfTecnico())
                .email(dto.email())
                .passwordHash(passwordEncoder.encode(dto.password()))
                .lgpdConsent(true)
                .perfil(perfil)
                .build();

        return mapearUsuario(usuarioRepository.save(usuario));
    }

    @Transactional(readOnly = true)
    public Page<AdminUsuarioDTO> listarUsuarios(
            String termo,
            Perfil perfil,
            Boolean ativo,
            Boolean banido,
            LocalDate criadoDe,
            LocalDate criadoAte,
            Pageable pageable
    ) {
        LocalDateTime criadoDeInicio = criadoDe != null ? criadoDe.atStartOfDay() : null;
        LocalDateTime criadoAteFim = criadoAte != null ? criadoAte.plusDays(1).atStartOfDay() : null;

        var filtrados = usuarioRepository.findAll().stream()
                .filter(u -> perfil == null || u.getPerfil() == perfil)
                .filter(u -> ativo == null || Boolean.valueOf(ativo).equals(u.getIsActive()))
                .filter(u -> banido == null || Boolean.valueOf(banido).equals(u.getBanido()))
                .filter(u -> criadoDeInicio == null || (u.getCreatedAt() != null && !u.getCreatedAt().isBefore(criadoDeInicio)))
                .filter(u -> criadoAteFim == null || (u.getCreatedAt() != null && u.getCreatedAt().isBefore(criadoAteFim)))
                .filter(u -> correspondePesquisa(u, termo))
                .sorted(Comparator.comparing(Usuario::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::mapearUsuario)
                .toList();

        int start = Math.min((int) pageable.getOffset(), filtrados.size());
        int end = Math.min(start + pageable.getPageSize(), filtrados.size());
        return new PageImpl<>(filtrados.subList(start, end), pageable, filtrados.size());
    }

    public AdminUsuarioDTO ativarUsuario(UUID usuarioId) {
        Usuario usuario = buscarUsuario(usuarioId);
        usuario.setIsActive(true);
        usuario.setBanido(false);
        return mapearUsuario(usuarioRepository.save(usuario));
    }

    public AdminUsuarioDTO desativarUsuario(UUID usuarioId, String emailAdminLogado) {
        Usuario adminLogado = buscarUsuarioPorEmail(emailAdminLogado);
        Usuario usuario = buscarUsuario(usuarioId);
        validarProtecaoAdmin(adminLogado, usuario, "desativar");
        usuario.setIsActive(false);
        return mapearUsuario(usuarioRepository.save(usuario));
    }

    public AdminUsuarioDTO banirUsuario(UUID usuarioId, String emailAdminLogado) {
        Usuario adminLogado = buscarUsuarioPorEmail(emailAdminLogado);
        Usuario usuario = buscarUsuario(usuarioId);
        validarProtecaoAdmin(adminLogado, usuario, "banir");
        usuario.setIsActive(false);
        usuario.setBanido(true);
        return mapearUsuario(usuarioRepository.save(usuario));
    }

    public void excluirUsuario(UUID usuarioId, String emailAdminLogado) {
        Usuario adminLogado = buscarUsuarioPorEmail(emailAdminLogado);
        Usuario usuario = buscarUsuario(usuarioId);
        validarProtecaoAdmin(adminLogado, usuario, "excluir");
        usuario.setIsActive(false);
        usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public AdminDashboardDTO dashboard(
            LocalDate criadoDe,
            LocalDate criadoAte,
            Anuncio.TipoAnuncio tipo,
            Anuncio.StatusAnuncio status,
            Integer categoriaId
    ) {
        LocalDateTime inicio = criadoDe != null ? criadoDe.atStartOfDay() : null;
        LocalDateTime fim = criadoAte != null ? criadoAte.plusDays(1).atStartOfDay() : null;
        DateTimeFormatter mesAno = DateTimeFormatter.ofPattern("MM/yyyy");

        Predicate<Anuncio> filtroAnuncio = anuncio -> dentroDoPeriodo(anuncio.getCriadoEm(), inicio, fim)
                && (tipo == null || anuncio.getTipo() == tipo)
                && (status == null || anuncio.getStatus() == status)
                && (categoriaId == null || anuncio.getCategoria().getId().equals(categoriaId));
        Predicate<Anuncio> filtroNegocioAnuncio = anuncio -> (tipo == null || anuncio.getTipo() == tipo)
                && (status == null || anuncio.getStatus() == status)
                && (categoriaId == null || anuncio.getCategoria().getId().equals(categoriaId));

        var usuarios = usuarioRepository.findAll().stream()
                .filter(usuario -> dentroDoPeriodo(usuario.getCreatedAt(), inicio, fim))
                .toList();
        var anuncios = anuncioRepository.findAll().stream()
                .filter(filtroAnuncio)
                .toList();
        var denuncias = denunciaRepository.findAll().stream()
                .filter(denuncia -> dentroDoPeriodo(denuncia.getCriadoEm(), inicio, fim))
                .filter(denuncia -> filtroNegocioAnuncio.test(denuncia.getAnuncio()))
                .toList();

        var usuariosPorMes = usuarios.stream()
                .filter(usuario -> usuario.getCreatedAt() != null)
                .collect(Collectors.groupingBy(usuario -> usuario.getCreatedAt().toLocalDate().withDayOfMonth(1), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AdminDashboardDTO.SerieDTO(entry.getKey().format(mesAno), entry.getValue()))
                .toList();

        var concluidosPorMes = anuncios.stream()
                .filter(anuncio -> anuncio.getAtualizadoEm() != null && anuncio.getStatus() == Anuncio.StatusAnuncio.CONCLUIDO)
                .collect(Collectors.groupingBy(anuncio -> anuncio.getAtualizadoEm().toLocalDate().withDayOfMonth(1), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AdminDashboardDTO.SerieDTO(entry.getKey().format(mesAno), entry.getValue()))
                .toList();

        var anunciosCriadosPorMes = anuncios.stream()
                .filter(anuncio -> anuncio.getCriadoEm() != null)
                .collect(Collectors.groupingBy(anuncio -> anuncio.getCriadoEm().toLocalDate().withDayOfMonth(1)))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AdminDashboardDTO.SerieComparativaDTO(
                        entry.getKey().format(mesAno),
                        entry.getValue().stream().filter(anuncio -> anuncio.getTipo() == Anuncio.TipoAnuncio.DOACAO).count(),
                        entry.getValue().stream().filter(anuncio -> anuncio.getTipo() == Anuncio.TipoAnuncio.TROCA).count()
                ))
                .toList();

        var denunciasPorMes = denuncias.stream()
                .collect(Collectors.groupingBy(denuncia -> denuncia.getCriadoEm().toLocalDate().withDayOfMonth(1)))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> new AdminDashboardDTO.SerieComparativaDTO(
                        entry.getKey().format(mesAno),
                        entry.getValue().stream().filter(denuncia -> denuncia.getStatus() == DenunciaAnuncio.StatusDenuncia.ABERTA).count(),
                        entry.getValue().stream().filter(denuncia -> denuncia.getStatus() != DenunciaAnuncio.StatusDenuncia.ABERTA).count()
                ))
                .toList();

        var topAnuncios = anuncios.stream()
                .sorted(Comparator.comparing(
                        (Anuncio anuncio) -> anuncio.getTotalVisualizacoes() == null ? 0 : anuncio.getTotalVisualizacoes(),
                        Comparator.reverseOrder()
                ))
                .limit(5)
                .map(anuncio -> new AdminDashboardDTO.ItemRankingDTO(
                        anuncio.getId().toString(),
                        anuncio.getTitulo(),
                        anuncio.getTotalVisualizacoes() == null ? 0 : anuncio.getTotalVisualizacoes()
                ))
                .toList();

        var topUsuarios = usuarios.stream()
                .sorted(Comparator.comparing(
                        (Usuario usuario) -> reputacaoOuZero(usuario),
                        Comparator.reverseOrder()
                ))
                .limit(5)
                .map(u -> new AdminDashboardDTO.ItemRankingDTO(
                        u.getId().toString(),
                        u.getName(),
                        reputacaoOuZero(u)
                ))
                .toList();

        var topCategorias = anuncios.stream()
                .collect(Collectors.groupingBy(anuncio -> anuncio.getCategoria().getId(), Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<Integer, Long>comparingByValue().reversed())
                .limit(5)
                .map(entry -> new AdminDashboardDTO.ItemRankingDTO(
                        entry.getKey().toString(),
                        anuncios.stream()
                                .filter(anuncio -> anuncio.getCategoria().getId().equals(entry.getKey()))
                                .findFirst()
                                .map(anuncio -> anuncio.getCategoria().getNome())
                                .orElse("Categoria"),
                        entry.getValue()
                ))
                .toList();

        return new AdminDashboardDTO(
                usuarios.size(),
                usuarios.stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count(),
                usuarios.stream().filter(u -> Boolean.TRUE.equals(u.getBanido())).count(),
                anuncios.size(),
                anuncios.stream().filter(anuncio -> anuncio.getStatus() == Anuncio.StatusAnuncio.ATIVO).count(),
                anuncios.stream().filter(anuncio -> anuncio.getStatus() == Anuncio.StatusAnuncio.PENDENTE).count(),
                anuncios.stream().filter(anuncio -> anuncio.getStatus() == Anuncio.StatusAnuncio.REPROVADO).count(),
                anuncios.stream().filter(anuncio -> anuncio.getStatus() == Anuncio.StatusAnuncio.CONCLUIDO).count(),
                anuncios.stream().filter(anuncio -> anuncio.getTipo() == Anuncio.TipoAnuncio.DOACAO).count(),
                anuncios.stream().filter(anuncio -> anuncio.getTipo() == Anuncio.TipoAnuncio.TROCA).count(),
                denuncias.stream().filter(denuncia -> denuncia.getStatus() == DenunciaAnuncio.StatusDenuncia.ABERTA).count(),
                denuncias.stream().filter(denuncia -> denuncia.getStatus() != DenunciaAnuncio.StatusDenuncia.ABERTA).count(),
                usuariosPorMes,
                concluidosPorMes,
                anunciosCriadosPorMes,
                denunciasPorMes,
                topAnuncios,
                topUsuarios,
                topCategorias
        );
    }

    private boolean dentroDoPeriodo(LocalDateTime valor, LocalDateTime inicio, LocalDateTime fim) {
        return valor != null
                && (inicio == null || !valor.isBefore(inicio))
                && (fim == null || valor.isBefore(fim));
    }

    private BigDecimal reputacaoOuZero(Usuario usuario) {
        return usuario.getReputationScore() == null ? BigDecimal.ZERO : usuario.getReputationScore();
    }

    @Transactional(readOnly = true)
    public Page<HistoricoModeracaoDTO> logsAuditoria(
            String termo,
            String acao,
            LocalDate criadoDe,
            LocalDate criadoAte,
            Pageable pageable
    ) {
        return historicoRepository.buscar(
                        UUID_SENTINELA,
                        UUID_SENTINELA,
                        normalizarPesquisa(termo),
                        normalizarPesquisa(acao),
                        criadoDe != null ? criadoDe.atStartOfDay() : INICIO_FILTRO,
                        criadoAte != null ? criadoAte.plusDays(1).atStartOfDay() : FIM_FILTRO,
                        pageable
                )
                .map(this::mapearHistorico);
    }

    private Usuario buscarUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", id));
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuario", email));
    }

    private void validarProtecaoAdmin(Usuario adminLogado, Usuario alvo, String acao) {
        if (adminLogado.getId().equals(alvo.getId())) {
            throw new RegraNegocioException("Voce nao pode " + acao + " a propria conta admin.");
        }

        if (alvo.getPerfil() == Perfil.ADMIN
                && usuarioRepository.countAtivosNaoBanidosPorPerfil(Perfil.ADMIN) <= 1) {
            throw new RegraNegocioException("Nao e possivel " + acao + " o ultimo administrador ativo.");
        }
    }

    private String gerarCpfTecnico() {
        String cpf;
        do {
            cpf = String.format("9%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 10_000_000_000L);
        } while (usuarioRepository.existsByCpf(cpf));
        return cpf;
    }

    private AdminUsuarioDTO mapearUsuario(Usuario usuario) {
        return new AdminUsuarioDTO(
                usuario.getId(),
                mascararNome(usuario.getName()),
                mascararEmail(usuario.getEmail()),
                mascararDocumento(usuario.getCpf()),
                mascararTelefone(usuario.getPhone()),
                usuario.getPerfil(),
                usuario.getIsActive(),
                usuario.getBanido(),
                usuario.getReputationScore(),
                usuario.getCreatedAt()
        );
    }

    private String normalizarPesquisa(String valor) {
        return valor == null || valor.isBlank() ? "" : valor.trim();
    }

    private String mascararNome(String nome) {
        if (nome == null || nome.isBlank()) return "";
        String[] partes = nome.trim().split("\\s+");
        return java.util.stream.IntStream.range(0, partes.length)
                .mapToObj(indice -> indice == 0 ? partes[indice] : mascararPalavra(partes[indice]))
                .collect(Collectors.joining(" "));
    }

    private String mascararEmail(String email) {
        if (email == null || !email.contains("@")) return "";
        String[] partes = email.split("@", 2);
        String usuario = partes[0];
        if (usuario.length() <= 2) return "*".repeat(usuario.length()) + "@" + partes[1];
        if (usuario.length() <= 4) {
            return usuario.charAt(0)
                    + "*".repeat(Math.max(1, usuario.length() - 2))
                    + usuario.charAt(usuario.length() - 1)
                    + "@" + partes[1];
        }
        return usuario.substring(0, 2)
                + "*".repeat(Math.max(3, usuario.length() - 4))
                + usuario.substring(usuario.length() - 2)
                + "@" + partes[1];
    }

    private boolean correspondePesquisa(Usuario usuario, String termo) {
        if (termo == null || termo.isBlank()) return true;

        String termoNormalizado = termo.trim().toLowerCase(Locale.ROOT);
        String digitosPesquisados = termo.replaceAll("\\D", "");
        return contemIgnoreCase(usuario.getName(), termoNormalizado)
                || contemIgnoreCase(usuario.getEmail(), termoNormalizado)
                || (!digitosPesquisados.isBlank()
                    && somenteDigitos(usuario.getCpf()).contains(digitosPesquisados))
                || (usuario.getId() != null
                    && usuario.getId().toString().toLowerCase(Locale.ROOT).contains(termoNormalizado));
    }

    private boolean contemIgnoreCase(String valor, String termoNormalizado) {
        return valor != null && valor.toLowerCase(Locale.ROOT).contains(termoNormalizado);
    }

    private String somenteDigitos(String valor) {
        return valor == null ? "" : valor.replaceAll("\\D", "");
    }

    private String mascararPalavra(String palavra) {
        return palavra.length() <= 1
                ? palavra
                : palavra.charAt(0) + "*".repeat(palavra.length() - 1);
    }

    private String mascararDocumento(String documento) {
        if (documento == null || documento.isBlank()) return "";
        String digitos = documento.replaceAll("\\D", "");
        if (digitos.length() < 4) return "*".repeat(digitos.length());
        return "*".repeat(digitos.length() - 4) + digitos.substring(digitos.length() - 4);
    }

    private String mascararTelefone(String telefone) {
        if (telefone == null || telefone.isBlank()) return null;
        String digitos = telefone.replaceAll("\\D", "");
        if (digitos.length() < 4) return "*".repeat(digitos.length());
        return "*".repeat(digitos.length() - 4) + digitos.substring(digitos.length() - 4);
    }

    private HistoricoModeracaoDTO mapearHistorico(HistoricoModeracao historico) {
        return new HistoricoModeracaoDTO(
                historico.getId(),
                historico.getModerador().getId(),
                historico.getModerador().getName(),
                historico.getAcao(),
                historico.getAlvoTipo(),
                historico.getAlvoId(),
                historico.getDetalhes(),
                historico.getCriadoEm()
        );
    }
}
