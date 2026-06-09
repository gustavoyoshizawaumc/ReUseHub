package com.reusehub.backend.config;

import com.reusehub.anuncio.service.StorageService;
import com.reusehub.auth.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;

@SpringBootTest(classes = com.reusehub.backend.BackendApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.data.mongodb.uri=mongodb://localhost:27017/test"
})
@DisplayName("Testes do SecurityConfig - Cabeçalhos de Segurança")
class SecurityConfigTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private StorageService storageService;

    @MockBean
    private com.reusehub.auth.repository.UsuarioRepository usuarioRepository;

    @MockBean
    private org.springframework.security.authentication.AuthenticationProvider authenticationProvider;

    @Test
    @DisplayName("deve enviar X-Content-Type-Options nosniff")
    void enviaContentTypeOptions() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
    }

    @Test
    @DisplayName("deve enviar X-Frame-Options DENY")
    void enviaFrameOptions() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }

    @Test
    @DisplayName("deve enviar Referrer-Policy strict-origin-when-cross-origin")
    void enviaReferrerPolicy() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(header().string("Referrer-Policy", "strict-origin-when-cross-origin"));
    }

    @Test
    @DisplayName("deve enviar Content-Security-Policy da API")
    void enviaContentSecurityPolicy() throws Exception {
        mockMvc.perform(get("/api/categorias"))
                .andExpect(header().string("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'"));
    }

    @Test
    @DisplayName("deve enviar Strict-Transport-Security em requisição HTTPS")
    void enviaHsts() throws Exception {
        mockMvc.perform(get("/api/categorias").secure(true))
                .andExpect(header().string("Strict-Transport-Security", containsString("max-age=31536000")))
                .andExpect(header().string("Strict-Transport-Security", containsString("includeSubDomains")));
    }
}
