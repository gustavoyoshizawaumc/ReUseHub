package com.reusehub.anuncio.service;

import com.reusehub.anuncio.dto.AnuncioEdicaoDTO;
import com.reusehub.anuncio.dto.AnuncioRequestDTO;
import com.reusehub.anuncio.dto.AnuncioRespostaDTO;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.Categoria;
import com.reusehub.auth.model.Usuario;
import com.reusehub.anuncio.model.enums.CondicaoItem; // Import atualizado!
import com.reusehub.anuncio.model.enums.StatusAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.CategoriaRepository;
import com.reusehub.auth.repository.UsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AnuncioService {

    private final AnuncioRepository anuncioRepository;
    private final CategoriaRepository categoriaRepository;
    private final UsuarioRepository usuarioRepository;
    private final ImagemService imagemService;

    public AnuncioRespostaDTO publicar(AnuncioRequestDTO dto, List<MultipartFile> imagens) throws IOException {
        Usuario usuario = buscarUsuarioPorId(dto.getUsuarioId());
        Categoria categoria = buscarCategoriaPorId(dto.getCategoriaId());

        Anuncio anuncio = criarAnuncio(dto, usuario, categoria);
        Anuncio salvo = anuncioRepository.save(anuncio);

        if (imagensForamEnviadas(imagens)) {
            imagemService.salvarImagens(salvo.getId(), imagens);
        }

        return converterParaResposta(salvo, usuario, categoria);
    }

    public AnuncioRespostaDTO buscarPorId(UUID id) {
        Anuncio anuncio = buscarAnuncioPorId(id);
        return converterParaRespostaComDependencias(anuncio);
    }

    public List<AnuncioRespostaDTO> listarAtivos() {
        return anuncioRepository.findByStatus(StatusAnuncio.ACTIVE)
                .stream()
                .map(this::converterParaRespostaComDependencias)
                .toList();
    }

    public List<AnuncioRespostaDTO> listarPorUsuario(UUID usuarioId) {
        return anuncioRepository.findByUsuario_Id(usuarioId)
                .stream()
                .map(this::converterParaRespostaComDependencias)
                .toList();
    }

    public AnuncioRespostaDTO editar(UUID id, AnuncioEdicaoDTO dto, List<MultipartFile> novasImagens) throws IOException {
        Anuncio anuncio = buscarAnuncioPorId(id);

        verificarPermissao(anuncio, dto.getUsuarioId());
        verificarSeAnuncioPodeSerEditado(anuncio);

        Categoria categoria = buscarCategoriaPorId(dto.getCategoriaId());

        atualizarDadosDoAnuncio(anuncio, dto, categoria);

        if (imagensForamEnviadas(novasImagens)) {
            imagemService.deletarImagens(id);
            imagemService.salvarImagens(id, novasImagens);
        }

        Anuncio atualizado = anuncioRepository.save(anuncio);
        Usuario usuario = buscarUsuarioPorId(atualizado.getUsuario().getId());

        return converterParaResposta(atualizado, usuario, categoria);
    }

    public AnuncioRespostaDTO pausar(UUID id, UUID usuarioId) {
        Anuncio anuncio = buscarAnuncioPorId(id);

        verificarPermissao(anuncio, usuarioId);
        verificarSeAnuncioPodeSerPausado(anuncio);

        anuncio.setStatus(StatusAnuncio.CANCELLED);
        anuncioRepository.save(anuncio);

        return converterParaRespostaComDependencias(anuncio);
    }

    public AnuncioRespostaDTO reativar(UUID id, UUID usuarioId) {
        Anuncio anuncio = buscarAnuncioPorId(id);

        verificarPermissao(anuncio, usuarioId);
        verificarSeAnuncioPodeSerReativado(anuncio);

        anuncio.setStatus(StatusAnuncio.ACTIVE);
        anuncioRepository.save(anuncio);

        return converterParaRespostaComDependencias(anuncio);
    }

    public AnuncioRespostaDTO encerrar(UUID id, UUID usuarioId) {
        Anuncio anuncio = buscarAnuncioPorId(id);

        verificarPermissao(anuncio, usuarioId);
        verificarSeAnuncioJaEstaEncerrado(anuncio);

        anuncio.setStatus(StatusAnuncio.COMPLETED);
        anuncioRepository.save(anuncio);

        return converterParaRespostaComDependencias(anuncio);
    }

    public void deletar(UUID id, UUID usuarioId) throws IOException {
        Anuncio anuncio = buscarAnuncioPorId(id);

        verificarPermissao(anuncio, usuarioId);
        imagemService.deletarImagens(id);
        anuncioRepository.deleteById(id);
    }


    private Anuncio criarAnuncio(AnuncioRequestDTO dto, Usuario usuario, Categoria categoria) {
        Anuncio anuncio = new Anuncio();
        anuncio.setUsuario(usuario);
        anuncio.setCategoria(categoria);
        anuncio.setTitulo(dto.getTitulo());
        anuncio.setDescricao(dto.getDescricao());
        anuncio.setTipo(dto.getTipo());
        anuncio.setCondicao(dto.getCondicao());
        // Como você usou o @PrePersist na Entidade, não precisamos mais colocar as datas e o status inicial aqui! O Java faz isso sozinho agora.
        return anuncio;
    }

    private void atualizarDadosDoAnuncio(Anuncio anuncio, AnuncioEdicaoDTO dto, Categoria categoria) {
        anuncio.setTitulo(dto.getTitulo());
        anuncio.setDescricao(dto.getDescricao());
        anuncio.setTipo(dto.getTipo());
        anuncio.setCondicao(dto.getCondicao());
        anuncio.setCategoria(categoria);
        // O @PreUpdate da sua Entidade vai cuidar do atualizadoEm sozinho também!
    }

    private AnuncioRespostaDTO converterParaRespostaComDependencias(Anuncio anuncio) {
        Usuario usuario = anuncio.getUsuario();
        Categoria categoria = anuncio.getCategoria();
        return converterParaResposta(anuncio, usuario, categoria);
    }

    private AnuncioRespostaDTO converterParaResposta(Anuncio anuncio, Usuario usuario, Categoria categoria) {
        AnuncioRespostaDTO resposta = new AnuncioRespostaDTO();
        resposta.setId(anuncio.getId());
        resposta.setTitulo(anuncio.getTitulo());
        resposta.setDescricao(anuncio.getDescricao());
        resposta.setTipo(anuncio.getTipo());
        resposta.setCondicao(anuncio.getCondicao());
        resposta.setStatus(anuncio.getStatus());

        resposta.setUsuarioId(usuario.getId());
        resposta.setNomeUsuario(usuario.getName());

        resposta.setCategoriaId(categoria.getId());
        resposta.setNomeCategoria(categoria.getNome());

        resposta.setUrlsImagens(imagemService.buscarUrls(anuncio.getId()));
        resposta.setTotalVisualizacoes(anuncio.getTotalVisualizacoes());
        resposta.setCriadoEm(anuncio.getCriadoEm());
        resposta.setAtualizadoEm(anuncio.getAtualizadoEm());
        return resposta;
    }

    private void verificarPermissao(Anuncio anuncio, UUID usuarioId) {
        if (!anuncio.pertenceAo(usuarioId)) {
            throw new RuntimeException("Você não tem permissão para alterar este anúncio");
        }
    }

    private void verificarSeAnuncioPodeSerEditado(Anuncio anuncio) {
        if (!anuncio.podeSerEditado()) {
            throw new RuntimeException("Anúncio concluído não pode ser editado");
        }
    }

    private void verificarSeAnuncioPodeSerPausado(Anuncio anuncio) {
        if (!anuncio.podeSerPausado()) {
            throw new RuntimeException("Apenas anúncios ATIVOS podem ser pausados");
        }
    }

    private void verificarSeAnuncioPodeSerReativado(Anuncio anuncio) {
        if (!anuncio.podeSerReativado()) {
            throw new RuntimeException("Apenas anúncios PAUSADOS podem ser reativados");
        }
    }

    private void verificarSeAnuncioJaEstaEncerrado(Anuncio anuncio) {
        if (anuncio.jaEstaEncerrado()) {
            throw new RuntimeException("Anúncio já está encerrado");
        }
    }

    private Anuncio buscarAnuncioPorId(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Anúncio não encontrado: " + id));
    }

    private Usuario buscarUsuarioPorId(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado: " + id));
    }

    private Categoria buscarCategoriaPorId(Integer id) {
        return categoriaRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Categoria não encontrada: " + id));
    }

    private boolean imagensForamEnviadas(List<MultipartFile> imagens) {
        return imagens != null && !imagens.isEmpty();
    }
}