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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class AdminService {

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
                .filter(u -> termo == null || termo.isBlank()
                        || u.getName().toLowerCase(Locale.ROOT).contains(termo.toLowerCase(Locale.ROOT))
                        || u.getEmail().toLowerCase(Locale.ROOT).contains(termo.toLowerCase(Locale.ROOT))
                        || u.getCpf().contains(termo.replaceAll("\\D", "")))
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
    public AdminDashboardDTO dashboard() {
        var usuarios = usuarioRepository.findAll();
        var anuncios = anuncioRepository.findAll();
        DateTimeFormatter mesAno = DateTimeFormatter.ofPattern("MM/yyyy");

        var usuariosPorMes = usuarios.stream()
                .filter(u -> u.getCreatedAt() != null)
                .collect(Collectors.groupingBy(u -> u.getCreatedAt().format(mesAno), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new AdminDashboardDTO.SerieDTO(e.getKey(), e.getValue()))
                .toList();

        var concluidosPorMes = anuncios.stream()
                .filter(a -> a.getAtualizadoEm() != null && a.getStatus() == Anuncio.StatusAnuncio.CONCLUIDO)
                .collect(Collectors.groupingBy(a -> a.getAtualizadoEm().format(mesAno), Collectors.counting()))
                .entrySet().stream()
                .map(e -> new AdminDashboardDTO.SerieDTO(e.getKey(), e.getValue()))
                .toList();

        var topAnuncios = anuncioRepository.findTop5ByOrderByTotalVisualizacoesDesc().stream()
                .map(a -> new AdminDashboardDTO.ItemRankingDTO(
                        a.getId().toString(),
                        a.getTitulo(),
                        a.getTotalVisualizacoes() == null ? 0 : a.getTotalVisualizacoes()
                ))
                .toList();

        var topUsuarios = usuarioRepository.findTop5ByOrderByReputationScoreDesc().stream()
                .map(u -> new AdminDashboardDTO.ItemRankingDTO(
                        u.getId().toString(),
                        u.getName(),
                        u.getReputationScore() == null ? 0 : u.getReputationScore()
                ))
                .toList();

        return new AdminDashboardDTO(
                usuarios.size(),
                usuarios.stream().filter(u -> Boolean.TRUE.equals(u.getIsActive())).count(),
                usuarios.stream().filter(u -> Boolean.TRUE.equals(u.getBanido())).count(),
                anuncios.size(),
                anuncioRepository.countByStatus(Anuncio.StatusAnuncio.ATIVO),
                anuncioRepository.countByStatus(Anuncio.StatusAnuncio.PENDENTE),
                anuncioRepository.countByStatus(Anuncio.StatusAnuncio.REPROVADO),
                anuncioRepository.countByStatus(Anuncio.StatusAnuncio.CONCLUIDO),
                anuncioRepository.countByTipo(Anuncio.TipoAnuncio.DOACAO),
                anuncioRepository.countByTipo(Anuncio.TipoAnuncio.TROCA),
                denunciaRepository.countByStatus(DenunciaAnuncio.StatusDenuncia.ABERTA),
                denunciaRepository.countByStatusNot(DenunciaAnuncio.StatusDenuncia.ABERTA),
                usuariosPorMes,
                concluidosPorMes,
                topAnuncios,
                topUsuarios
        );
    }

    @Transactional(readOnly = true)
    public Page<HistoricoModeracaoDTO> logsAuditoria(Pageable pageable) {
        return historicoRepository.findAllByOrderByCriadoEmDesc(pageable)
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
                usuario.getName(),
                usuario.getEmail(),
                usuario.getCpf(),
                usuario.getPhone(),
                usuario.getPerfil(),
                usuario.getIsActive(),
                usuario.getBanido(),
                usuario.getReputationScore(),
                usuario.getCreatedAt()
        );
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
