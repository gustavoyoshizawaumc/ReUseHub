package com.reusehub.anuncio.service;

import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.model.ImagemAnuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.anuncio.repository.ImagemAnuncioRepository;
import lombok.RequiredArgsConstructor;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ImagemService {

    private final ImagemAnuncioRepository imagemAnuncioRepository;
    private final AnuncioRepository anuncioRepository;

    @Value("${storage.path:uploads/listings}")
    private String caminhoStorage;

    @Value("${storage.base-url:http://localhost:8080/files}")
    private String urlBase;

    private static final int MAXIMO_IMAGENS    = 5;
    private static final int LARGURA_IMAGEM    = 1200;
    private static final int ALTURA_IMAGEM     = 900;
    private static final int LARGURA_THUMBNAIL = 400;
    private static final int ALTURA_THUMBNAIL  = 300;
    private static final long TAMANHO_MAXIMO   = 8L * 1024 * 1024;

    public void salvarImagens(UUID anuncioId, List<MultipartFile> arquivos) throws IOException {
        verificarLimiteDeImagens(anuncioId, arquivos.size());

        int quantidadeAtual = imagemAnuncioRepository.countByAnuncio_Id(anuncioId);

        for (int i = 0; i < arquivos.size(); i++) {
            MultipartFile arquivo = arquivos.get(i);
            validarArquivo(arquivo);
            salvarArquivo(anuncioId, arquivo, quantidadeAtual + i);
        }
    }

    public void deletarImagens(UUID anuncioId) throws IOException {
        List<ImagemAnuncio> imagens = imagemAnuncioRepository
                .findByAnuncio_IdOrderByOrdemExibicaoAsc(anuncioId);

        for (ImagemAnuncio imagem : imagens) {
            deletarArquivosDoDisco(anuncioId, imagem.getNomeArquivo());
        }

        imagemAnuncioRepository.deleteByAnuncio_Id(anuncioId);
    }

    public List<String> buscarUrls(UUID anuncioId) {
        return imagemAnuncioRepository
                .findByAnuncio_IdOrderByOrdemExibicaoAsc(anuncioId)
                .stream()
                .map(ImagemAnuncio::getUrlImagem)
                .toList();
    }

    private void salvarArquivo(UUID anuncioId, MultipartFile arquivo, int ordem) throws IOException {
        String nomeArquivo   = gerarNomeUnico(arquivo.getOriginalFilename());
        String nomeThumbnail = gerarNomeThumbnail(nomeArquivo);

        Path pasta          = criarPastaDoAnuncio(anuncioId);
        Path caminhoArquivo = pasta.resolve(nomeArquivo);
        Path caminhoThumb   = pasta.resolve(nomeThumbnail);

        otimizarImagem(arquivo, caminhoArquivo);
        gerarThumbnail(caminhoArquivo, caminhoThumb);

        Anuncio anuncioRef = anuncioRepository.getReferenceById(anuncioId);

        imagemAnuncioRepository.save(
                montarImagemAnuncio(anuncioRef, nomeArquivo, nomeThumbnail, ordem)
        );
    }

    private void otimizarImagem(MultipartFile arquivo, Path destino) throws IOException {
        Thumbnails.of(arquivo.getInputStream())
                .size(LARGURA_IMAGEM, ALTURA_IMAGEM)
                .outputQuality(0.85)
                .toFile(destino.toFile());
    }

    private void gerarThumbnail(Path origem, Path destino) throws IOException {
        Thumbnails.of(origem.toFile())
                .size(LARGURA_THUMBNAIL, ALTURA_THUMBNAIL)
                .outputQuality(0.80)
                .toFile(destino.toFile());
    }

    private ImagemAnuncio montarImagemAnuncio(Anuncio anuncio,
                                              String nomeArquivo,
                                              String nomeThumbnail,
                                              int ordem) {
        ImagemAnuncio imagem = new ImagemAnuncio();
        imagem.setAnuncio(anuncio);
        imagem.setUrlImagem(urlBase + "/" + anuncio.getId() + "/" + nomeArquivo);
        imagem.setUrlThumbnail(urlBase + "/" + anuncio.getId() + "/" + nomeThumbnail);
        imagem.setNomeArquivo(nomeArquivo);
        imagem.setEhCapa(ordem == 0);
        imagem.setOrdemExibicao(ordem);
        return imagem;
    }

    private void deletarArquivosDoDisco(UUID anuncioId, String nomeArquivo) throws IOException {
        Path pasta = Paths.get(caminhoStorage, anuncioId.toString());
        Files.deleteIfExists(pasta.resolve(nomeArquivo));
        Files.deleteIfExists(pasta.resolve(gerarNomeThumbnail(nomeArquivo)));
    }

    private Path criarPastaDoAnuncio(UUID anuncioId) throws IOException {
        Path pasta = Paths.get(caminhoStorage, anuncioId.toString());
        Files.createDirectories(pasta);
        return pasta;
    }

    private void verificarLimiteDeImagens(UUID anuncioId, int quantidadeNova) {
        int quantidadeAtual = imagemAnuncioRepository.countByAnuncio_Id(anuncioId);
        boolean ultrapassaLimite = quantidadeAtual + quantidadeNova > MAXIMO_IMAGENS;

        if (ultrapassaLimite) {
            throw new RuntimeException(
                    "Limite de " + MAXIMO_IMAGENS + " imagens por anúncio. " +
                            "O anúncio já possui " + quantidadeAtual + " imagem(ns)."
            );
        }
    }

    private void validarArquivo(MultipartFile arquivo) {
        if (arquivo.isEmpty()) {
            throw new RuntimeException("Arquivo vazio não é permitido");
        }
        if (naoEhImagemPermitida(arquivo.getContentType())) {
            throw new RuntimeException("Apenas imagens JPEG e PNG são aceitas");
        }
        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new RuntimeException("Imagem muito grande. Tamanho máximo: 8MB");
        }
    }

    private boolean naoEhImagemPermitida(String contentType) {
        return contentType == null
                || (!contentType.equals("image/jpeg")
                &&  !contentType.equals("image/png"));
    }

    private String gerarNomeUnico(String nomeOriginal) {
        return UUID.randomUUID() + obterExtensao(nomeOriginal);
    }

    private String gerarNomeThumbnail(String nomeArquivo) {
        return nomeArquivo.replace(".", "_thumb.");
    }

    private String obterExtensao(String nomeOriginal) {
        if (nomeOriginal == null || !nomeOriginal.contains(".")) return ".jpg";
        return nomeOriginal.substring(nomeOriginal.lastIndexOf(".")).toLowerCase();
    }
}