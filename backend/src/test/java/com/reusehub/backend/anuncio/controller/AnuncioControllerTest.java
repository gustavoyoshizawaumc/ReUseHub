package com.reusehub.backend.anuncio.controller;

import com.reusehub.anuncio.dto.*;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.service.AnuncioService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = com.reusehub.backend.BackendApplication.class)
@AutoConfigureMockMvc
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.data.mongodb.uri=mongodb://localhost:27017/test"
})
@DisplayName("Testes do AnuncioController - Camada Web")
class AnuncioControllerTest {

    private static final String EMAIL_USUARIO_TESTE = "usuario@teste.com";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AnuncioService anuncioService;

    @MockBean
    private com.reusehub.auth.repository.UsuarioRepository usuarioRepository;

    @MockBean
    private org.springframework.security.authentication.AuthenticationProvider authenticationProvider;

    private AnuncioCriacaoComEnderecoDTO criarDtoValido() {
        AnuncioCriacaoComEnderecoDTO dto = new AnuncioCriacaoComEnderecoDTO();
        dto.setTitulo("item pra doação ou troca");
        dto.setDescricao("descrição da troca ou do item aqui testando");
        dto.setTipo(Anuncio.TipoAnuncio.DOACAO);
        dto.setCondicao(Anuncio.CondicaoItem.NOVO);
        dto.setCategoriaId(1);
        dto.setCep("01001-000");
        dto.setNumero("123");
        return dto;
    }

    private MockMultipartFile criarDadosPart(Object dto) throws Exception {
        return new MockMultipartFile("dados", "", "application/json", objectMapper.writeValueAsBytes(dto));
    }

    private MockMultipartFile criarImagemPart() {
        return new MockMultipartFile("imagens", "foto.png", "image/png", "bytes".getBytes());
    }

    @Nested
    @DisplayName("Cenários para criarAnuncio")
    class CriarAnuncio {

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("criar anúncio")
        void c1() throws Exception {
            AnuncioCriacaoComEnderecoDTO dto = criarDtoValido();
            Mockito.when(anuncioService.criarAnuncioComEndereco(Mockito.anyString(), Mockito.any(), Mockito.any()))
                   .thenReturn(AnuncioRespostaDTO.builder().titulo(dto.getTitulo()).build());

            mockMvc.perform(multipart("/api/anuncios").file(criarDadosPart(dto)).file(criarImagemPart()).with(csrf()))
                   .andExpect(status().isCreated());
        }

        @Test
        @DisplayName("deve retornar 401 se deslogado")
        void c2() throws Exception {
            mockMvc.perform(multipart("/api/anuncios").with(csrf()))
                   .andExpect(status().isForbidden());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve retornar 400 se título for inválido")
        void c3() throws Exception {
            AnuncioCriacaoComEnderecoDTO dto = criarDtoValido();
            dto.setTitulo("1234");

            mockMvc.perform(multipart("/api/anuncios").file(criarDadosPart(dto)).file(criarImagemPart()).with(csrf()))
                   .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve retornar 400 se descrição estiver em branco")
        void c4() throws Exception {
            AnuncioCriacaoComEnderecoDTO dto = criarDtoValido();
            dto.setDescricao(""); 

            mockMvc.perform(multipart("/api/anuncios").file(criarDadosPart(dto)).file(criarImagemPart()).with(csrf()))
                   .andExpect(status().isBadRequest());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve retornar 400 se tipo for nulo")
        void c5() throws Exception {
            AnuncioCriacaoComEnderecoDTO dto = criarDtoValido();
            dto.setTipo(null);

            mockMvc.perform(multipart("/api/anuncios").file(criarDadosPart(dto)).file(criarImagemPart()).with(csrf()))
                   .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("cenários para listarAnuncios")
    class ListarAnuncios {
        @Test
        @DisplayName("deve listar anúncios ativos anonimamente")
        void c1() throws Exception {
            Mockito.when(anuncioService.listarAnunciosAtivos(Mockito.any(Pageable.class)))
                   .thenReturn(new PageImpl<>(Collections.emptyList()));

            mockMvc.perform(get("/api/anuncios"))
                   .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve aceitar parâmetros de paginação customizados")
        void c2() throws Exception {
            mockMvc.perform(get("/api/anuncios").param("page", "2").param("size", "5"))
                   .andExpect(status().isOk());
        }
    }

    // GET /api/anuncios/meus
    @Nested
    @DisplayName("cenários para listarMeusAnuncios")
    class ListarMeusAnuncios {
        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve listar anúncios do usuário logado")
        void c1() throws Exception {
            Mockito.when(anuncioService.listarAnunciosDoUsuario(Mockito.eq(EMAIL_USUARIO_TESTE), Mockito.any(Pageable.class)))
                   .thenReturn(new PageImpl<>(Collections.emptyList()));

            mockMvc.perform(get("/api/anuncios/meus"))
                   .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve barrar usuário anônimo")
        void c2() throws Exception {
            mockMvc.perform(get("/api/anuncios/meus"))
                   .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("cenarios para favoritos")
    class Favoritos {
        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve listar favoritos do usuario logado")
        void listarFavoritos() throws Exception {
            Mockito.when(anuncioService.listarFavoritosDoUsuario(EMAIL_USUARIO_TESTE))
                    .thenReturn(Collections.emptyList());

            mockMvc.perform(get("/api/anuncios/favoritos"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve listar ids de favoritos do usuario logado")
        void listarIdsFavoritos() throws Exception {
            Mockito.when(anuncioService.listarIdsFavoritosDoUsuario(EMAIL_USUARIO_TESTE))
                    .thenReturn(List.of(UUID.randomUUID()));

            mockMvc.perform(get("/api/anuncios/favoritos/ids"))
                    .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve favoritar anuncio com sucesso")
        void favoritarAnuncio() throws Exception {
            mockMvc.perform(post("/api/anuncios/{id}/favoritos", UUID.randomUUID()).with(csrf()))
                    .andExpect(status().isCreated());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve desfavoritar anuncio com sucesso")
        void desfavoritarAnuncio() throws Exception {
            mockMvc.perform(delete("/api/anuncios/{id}/favoritos", UUID.randomUUID()).with(csrf()))
                    .andExpect(status().isNoContent());
        }
    }

    @Nested
    @DisplayName("cenários para buscarAnuncios")
    class BuscarAnuncios {
        @Test
        @DisplayName("deve buscar anúncios por termo válido")
        void c1() throws Exception {
            mockMvc.perform(get("/api/anuncios/buscar").param("termo", "cadeira"))
                   .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve retornar erro 400 se o termo não for enviado")
        void c2() throws Exception {
            mockMvc.perform(get("/api/anuncios/buscar"))
                   .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("cenários para listarPorCategoria")
    class ListarPorCategoria {
        @Test
        @DisplayName("deve filtrar por categoria com sucesso")
        void c1() throws Exception {
            mockMvc.perform(get("/api/anuncios/categoria/1"))
                   .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("cenários para listarPorTipo")
    class ListarPorTipo {
        @Test
        @DisplayName("deve filtrar por tipo DOACAO com sucesso")
        void c1() throws Exception {
            mockMvc.perform(get("/api/anuncios/tipo/DOACAO"))
                   .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve retornar 400 se passar tipo inválido no Enum")
        void c2() throws Exception {
            mockMvc.perform(get("/api/anuncios/tipo/INVALIDO"))
                   .andExpect(status().isBadRequest());
        }
    }

    @Nested
    @DisplayName("cenários para obterAnuncio")
    class ObterAnuncio {
        @Test
        @DisplayName("deve obter anúncio ativo de forma pública")
        void c1() throws Exception {
            UUID id = UUID.randomUUID();
            mockMvc.perform(get("/api/anuncios/{id}", id))
                   .andExpect(status().isOk());
        }
    }

    @Nested
    @DisplayName("cenários para atualizarAnuncio")
    class AtualizarAnuncio {
        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve atualizar anúncio com sucesso")
        void c1() throws Exception {
            UUID id = UUID.randomUUID();
            AnuncioAtualizacaoDTO dto = new AnuncioAtualizacaoDTO();
            dto.setTitulo("Novo Titulo");
                dto.setDescricao("Nova descrição de item tetse.");
                dto.setCondicao(Anuncio.CondicaoItem.RUIM);
                dto.setEnderecoId(UUID.randomUUID());

            mockMvc.perform(put("/api/anuncios/{id}", id)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(dto))
                    .with(csrf()))
                   .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve barrar atualização de usuário deslogado")
        void c2() throws Exception {
            mockMvc.perform(put("/api/anuncios/{id}", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("cenários para alterarStatus")
    class AlterarStatus {
        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve alterar status do anúncio com sucesso")
        void c1() throws Exception {
            mockMvc.perform(patch("/api/anuncios/{id}/status", UUID.randomUUID())
                    .param("status", "CONCLUIDO")
                    .with(csrf()))
                   .andExpect(status().isOk());
        }

        @Test
        @DisplayName("deve barrar alteração se deslogado")
        void c2() throws Exception {
            mockMvc.perform(patch("/api/anuncios/{id}/status", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("cenários para deletarAnuncio")
    class DeletarAnuncio {
        @Test
        @WithMockUser(username = "usuario@teste.com", roles = "USUARIO")
        @DisplayName("deve retornar 244/204 No Content ao deletar anúncio")
        void c1() throws Exception {
            mockMvc.perform(delete("/api/anuncios/{id}", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isNoContent());
        }

        @Test
        @DisplayName("deve barrar exclusão se deslogado")
        void c2() throws Exception {
            mockMvc.perform(delete("/api/anuncios/{id}", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("cenários para listarPendentes")
    class ListarPendentes {
        @Test
        @WithMockUser(username = "moderador@teste.com", roles = {"MODERADOR"})
        @DisplayName("deve permitir listagem de pendentes para MODERADOR")
        void c1() throws Exception {
            mockMvc.perform(get("/api/anuncios/moderacao/pendentes"))
                   .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = {"USER"})
        @DisplayName("deve proibir usuário comum de listar pendentes")
        void c2() throws Exception {
            mockMvc.perform(get("/api/anuncios/moderacao/pendentes"))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("cenários para aprovar")
    class AprovarAnuncio {
        @Test
        @WithMockUser(username = "moderador@teste.com", roles = {"MODERADOR"})
        @DisplayName("deve aprovar anúncio com sucesso")
        void c1() throws Exception {
            mockMvc.perform(patch("/api/anuncios/moderacao/{id}/aprovar", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = {"USER"})
        @DisplayName("deve barrar aprovação de usuário comum")
        void c2() throws Exception {
            mockMvc.perform(patch("/api/anuncios/moderacao/{id}/aprovar", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isForbidden());
        }
    }

    @Nested
    @DisplayName("cenários para reprovar")
    class ReprovarAnuncio {
        @Test
        @WithMockUser(username = "moderador@teste.com", roles = {"MODERADOR"})
        @DisplayName("deve reprovar anúncio com sucesso")
        void c1() throws Exception {
            mockMvc.perform(patch("/api/anuncios/moderacao/{id}/reprovar", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isOk());
        }

        @Test
        @WithMockUser(username = "usuario@teste.com", roles = {"USER"})
        @DisplayName("deve barrar reprovação de usuário comum")
        void c2() throws Exception {
            mockMvc.perform(patch("/api/anuncios/moderacao/{id}/reprovar", UUID.randomUUID()).with(csrf()))
                   .andExpect(status().isForbidden());
        }
    }
}
