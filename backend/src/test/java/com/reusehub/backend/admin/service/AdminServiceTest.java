package com.reusehub.backend.admin.service;

import com.reusehub.admin.service.AdminService;
import com.reusehub.admin.service.AdminRootGuard;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.CredencialBloqueada;
import com.reusehub.auth.model.Perfil;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.CredencialBloqueadaRepository;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.denuncia.repository.DenunciaAnuncioRepository;
import com.reusehub.interesse.service.InteresseCancelamentoService;
import com.reusehub.moderacao.repository.HistoricoModeracaoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("Testes Unitarios de AdminService")
class AdminServiceTest {

    @Mock private UsuarioRepository usuarioRepository;
    @Mock private CredencialBloqueadaRepository credencialBloqueadaRepository;
    @Mock private AnuncioRepository anuncioRepository;
    @Mock private DenunciaAnuncioRepository denunciaRepository;
    @Mock private HistoricoModeracaoRepository historicoRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private AdminRootGuard adminRootGuard;
    @Mock private InteresseCancelamentoService interesseCancelamentoService;

    @InjectMocks
    private AdminService adminService;

    private Usuario gustavo;
    private Usuario nadia;

    @BeforeEach
    void prepararUsuarios() {
        gustavo = usuario("Gustavo Santos", "gustavo@email.com", "12345678901");
        nadia = usuario("Nadia Alves", "nadia@email.com", "98765432100");
        org.mockito.Mockito.lenient().when(usuarioRepository.findAll()).thenReturn(List.of(gustavo, nadia));
    }

    @Test
    @DisplayName("deve buscar por nome, email, cpf e id sem aceitar cpf vazio")
    void buscarUsuarios() {
        var pagina = PageRequest.of(0, 20);

        assertEquals(1, adminService.listarUsuarios("Gustavo", null, null, null, null, null, pagina).getTotalElements());
        assertEquals(1, adminService.listarUsuarios("gustavo@email", null, null, null, null, null, pagina).getTotalElements());
        assertEquals(1, adminService.listarUsuarios("78901", null, null, null, null, null, pagina).getTotalElements());
        assertEquals(1, adminService.listarUsuarios(gustavo.getId().toString(), null, null, null, null, null, pagina).getTotalElements());
        assertEquals(0, adminService.listarUsuarios("inexistente", null, null, null, null, null, pagina).getTotalElements());
    }

    @Test
    @DisplayName("deve aplicar mascaras legiveis aos dados pessoais")
    void mascararDadosPessoais() {
        var pagina = PageRequest.of(0, 20);

        var usuario = adminService.listarUsuarios("Gustavo", null, null, null, null, null, pagina)
                .getContent()
                .getFirst();

        assertEquals("Gustavo S*****", usuario.name());
        assertEquals("gu***vo@email.com", usuario.email());
        assertEquals("*******8901", usuario.cpf());
    }

    @Test
    @DisplayName("nao deve reativar conta excluida e anonimizada")
    void naoReativarContaExcluida() {
        gustavo.setContaExcluida(true);
        when(usuarioRepository.findById(gustavo.getId())).thenReturn(java.util.Optional.of(gustavo));

        assertThrows(RegraNegocioException.class, () -> adminService.ativarUsuario(gustavo.getId()));
    }

    @Test
    @DisplayName("nao deve permitir banir o administrador raiz")
    void naoBanirAdminRaiz() {
        Usuario adminLogado = usuario("Admin Operador", "admin2@email.com", "12345678909");
        adminLogado.setPerfil(Perfil.ADMIN);
        Usuario adminRaiz = usuario("Administrador", "admin@reusehub.com", "12345678908");
        adminRaiz.setPerfil(Perfil.ADMIN);

        when(usuarioRepository.findByEmail("admin2@email.com")).thenReturn(java.util.Optional.of(adminLogado));
        when(usuarioRepository.findById(adminRaiz.getId())).thenReturn(java.util.Optional.of(adminRaiz));
        when(adminRootGuard.isAdminRaiz(adminRaiz)).thenReturn(true);

        assertThrows(RegraNegocioException.class, () ->
                adminService.banirUsuario(adminRaiz.getId(), "admin2@email.com")
        );
    }

    @Test
    @DisplayName("nao deve permitir admin banir outro admin")
    void naoBanirOutroAdmin() {
        Usuario adminLogado = usuario("Admin Operador", "admin2@email.com", "12345678909");
        adminLogado.setPerfil(Perfil.ADMIN);
        Usuario outroAdmin = usuario("Outro Admin", "admin3@email.com", "12345678908");
        outroAdmin.setPerfil(Perfil.ADMIN);

        when(usuarioRepository.findByEmail("admin2@email.com")).thenReturn(java.util.Optional.of(adminLogado));
        when(usuarioRepository.findById(outroAdmin.getId())).thenReturn(java.util.Optional.of(outroAdmin));

        assertThrows(RegraNegocioException.class, () ->
                adminService.banirUsuario(outroAdmin.getId(), "admin2@email.com")
        );
    }

    @Test
    @DisplayName("deve anonimizar usuario comum ao excluir pelo admin")
    void anonimizarUsuarioComum() {
        Usuario adminLogado = usuario("Admin Operador", "admin2@email.com", "12345678909");
        adminLogado.setPerfil(Perfil.ADMIN);

        when(usuarioRepository.findByEmail("admin2@email.com")).thenReturn(java.util.Optional.of(adminLogado));
        when(usuarioRepository.findById(gustavo.getId())).thenReturn(java.util.Optional.of(gustavo));
        when(passwordEncoder.encode(any())).thenReturn("hash-anonimo");
        when(credencialBloqueadaRepository.save(any(CredencialBloqueada.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        adminService.excluirUsuario(gustavo.getId(), "admin2@email.com");

        assertEquals("Usuario excluido", gustavo.getName());
        assertTrue(gustavo.getEmail().startsWith("excluido+" + gustavo.getId()));
        assertTrue(gustavo.getContaExcluida());
        assertFalse(gustavo.getIsActive());
        assertFalse(gustavo.getBanido());
        org.mockito.Mockito.verify(interesseCancelamentoService)
                .cancelarRelacionadosAoUsuario(gustavo, adminLogado);
    }

    private Usuario usuario(String nome, String email, String cpf) {
        Usuario usuario = Usuario.builder()
                .name(nome)
                .email(email)
                .cpf(cpf)
                .passwordHash("hash")
                .lgpdConsent(true)
                .perfil(Perfil.USUARIO)
                .build();
        usuario.setId(UUID.randomUUID());
        usuario.setCreatedAt(LocalDateTime.now());
        return usuario;
    }
}
