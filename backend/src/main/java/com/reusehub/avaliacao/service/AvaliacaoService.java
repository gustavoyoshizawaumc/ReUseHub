package com.reusehub.avaliacao.service;

import com.reusehub.anuncio.exception.AcessoNegadoException;
import com.reusehub.anuncio.exception.RecursoNaoEncontradoException;
import com.reusehub.anuncio.exception.RegraNegocioException;
import com.reusehub.anuncio.model.Anuncio;
import com.reusehub.anuncio.repository.AnuncioRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.avaliacao.dto.AvaliacaoCriacaoDTO;
import com.reusehub.avaliacao.dto.AvaliacaoRespostaDTO;
import com.reusehub.avaliacao.model.Avaliacao;
import com.reusehub.avaliacao.repository.AvaliacaoRepository;
import com.reusehub.interesse.model.InteresseTroca;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.util.Locale;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class AvaliacaoService {

    private static final Pattern MARCAS_DE_ACENTO = Pattern.compile("\\p{M}+");
    private static final Pattern CARACTERES_NAO_ALFANUMERICOS = Pattern.compile("[^a-z0-9]+");
    private static final Set<String> TERMOS_BLOQUEADOS = Set.of(
        "arrombado",
        "babaca",
        "besta",
        "boceta",
        "buceta",
        "bosta",
        "boiola",
        "burro",
        "cacete",
        "canalha",
        "caralho",
        "corno",
        "cu",
        "desgraçado",
        "desgracado",
        "escroto",
        "fdp",
        "filho da puta",
        "foda",
        "foder",
        "fudido",
        "idiota",
        "imbecil",
        "infeliz",
        "lixo",
        "merda",
        "otario",
        "otário",
        "palhaco",
        "palhaço",
        "pau no cu",
        "piranha",
        "porra",
        "retardado",
        "ridiculo",
        "ridículo",
        "safado",
        "tapado",
        "trouxa",
        "vagabundo",
        "vai tomar no cu",
        "vtnc",
        "anta",
        "animal",
        "asno",
        "babão",
        "babaca do caralho",
        "boçal",
        "cuzão",
        "cusao",
        "cretino",
        "debil",
        "débil",
        "demente",
        "energumeno",
        "energúmeno",
        "escória",
        "estrume",
        "estúpido",
        "feioso",
        "folgado",
        "fracassado",
        "gayzinho",
        "ignorante",
        "incapaz",
        "incompetente",
        "jumento",
        "lazarento",
        "maldito",
        "mongol",
        "nojento",
        "otário do caralho",
        "pau no seu cu",
        "paspalho",
        "pateta",
        "pau mandado",
        "pauzudo",
        "pauzão",
        "pirralho",
        "puta",
        "putinha",
        "puto",
        "rabudo",
        "sarnento",
        "seu merda",
        "seu lixo",
        "seu bosta",
        "seu idiota",
        "seu imbecil",
        "seu animal",
        "seu corno",
        "sifudê",
        "sifude",
        "tonto",
        "verme",
        "viado",
        "viadinho",
        "vagabunda",
        "vaca",
        "zé ruela",
        "ze ruela",
        "zé mané",
        "ze mane"
    );

    private final AvaliacaoRepository avaliacaoRepository;
    private final UsuarioRepository usuarioRepository;
    private final AnuncioRepository anuncioRepository;
    private final InteresseTrocaRepository interesseTrocaRepository;

    @Transactional
    public AvaliacaoRespostaDTO criar(String emailAvaliador, AvaliacaoCriacaoDTO dto) {
        Usuario avaliador = buscarUsuarioPorEmail(emailAvaliador);
        Usuario avaliado = buscarUsuario(dto.avaliadoId());
        Anuncio anuncio = buscarAnuncio(dto.anuncioId());

        validarPodeAvaliar(avaliador, avaliado, anuncio);
        validarComentarioSeguro(dto.comentario());

        if (avaliacaoRepository.existsByAvaliadorIdAndAnuncioId(avaliador.getId(), anuncio.getId())) {
            throw new RegraNegocioException("Você já avaliou esta negociação.");
        }

        Avaliacao avaliacao = avaliacaoRepository.save(Avaliacao.builder()
                .avaliador(avaliador)
                .avaliado(avaliado)
                .anuncio(anuncio)
                .nota(dto.nota())
                .comentario(normalizarComentarioParaSalvar(dto.comentario()))
                .build());

        atualizarReputacao(avaliado);
        return mapear(avaliacao);
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoRespostaDTO> listarRecebidas(UUID usuarioId) {
        return avaliacaoRepository.findByAvaliadoIdOrderByCriadoEmDesc(usuarioId)
                .stream()
                .map(this::mapear)
                .toList();
    }

    private void validarPodeAvaliar(Usuario avaliador, Usuario avaliado, Anuncio anuncio) {
        if (avaliador.getId().equals(avaliado.getId())) {
            throw new RegraNegocioException("Você não pode avaliar a si mesmo.");
        }

        if (anuncio.getStatus() != Anuncio.StatusAnuncio.CONCLUIDO) {
            throw new RegraNegocioException("A avaliação só é liberada depois que o anúncio é concluído.");
        }

        UUID donoId = anuncio.getUsuario().getId();
        boolean avaliadorEhDono = avaliador.getId().equals(donoId);
        boolean avaliadoEhDono = avaliado.getId().equals(donoId);
        boolean avaliadorAceito = interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                avaliador.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        );
        boolean avaliadoAceito = interesseTrocaRepository.existsByAnuncioDesejadoIdAndInteressadoIdAndStatus(
                anuncio.getId(),
                avaliado.getId(),
                InteresseTroca.StatusInteresse.ACEITO
        );

        boolean interessadoAvaliaDono = avaliadorAceito && avaliadoEhDono;
        boolean donoAvaliaInteressado = avaliadorEhDono && avaliadoAceito;

        if (!interessadoAvaliaDono && !donoAvaliaInteressado) {
            throw new AcessoNegadoException("Somente participantes de uma negociação aceita podem avaliar.");
        }
    }

    private void validarComentarioSeguro(String comentario) {
        if (comentario == null || comentario.isBlank()) {
            return;
        }

        String comentarioNormalizado = normalizarParaFiltro(comentario);
        String comentarioCompacto = normalizarCompacto(comentario);
        for (String termo : TERMOS_BLOQUEADOS) {
            String termoNormalizado = normalizarParaFiltro(termo);
            String termoCompacto = normalizarCompacto(termo);

            if (comentarioNormalizado.contains(termoNormalizado)
                    || comentarioCompacto.contains(termoCompacto)) {
                throw new RegraNegocioException(
                        "Seu comentario contem termos que violam as regras da comunidade. Revise o texto antes de enviar."
                );
            }
        }
    }

    private String normalizarComentarioParaSalvar(String comentario) {
        if (comentario == null) {
            return null;
        }

        String comentarioTratado = comentario.trim();
        return comentarioTratado.isEmpty() ? null : comentarioTratado;
    }

    private String normalizarParaFiltro(String texto) {
        String semAcentos = MARCAS_DE_ACENTO
                .matcher(Normalizer.normalize(texto, Normalizer.Form.NFD))
                .replaceAll("");
        String normalizado = CARACTERES_NAO_ALFANUMERICOS
                .matcher(semAcentos.toLowerCase(Locale.ROOT))
                .replaceAll(" ")
                .trim()
                .replaceAll("\\s+", " ");
        return " " + normalizado + " ";
    }

    private String normalizarCompacto(String texto) {
        String semAcentos = MARCAS_DE_ACENTO
                .matcher(Normalizer.normalize(texto, Normalizer.Form.NFD))
                .replaceAll("");
        return CARACTERES_NAO_ALFANUMERICOS
                .matcher(semAcentos.toLowerCase(Locale.ROOT))
                .replaceAll("");
    }

    private void atualizarReputacao(Usuario avaliado) {
        Double media = avaliacaoRepository.calcularMediaDoAvaliado(avaliado.getId());
        avaliado.setReputationScore(media == null
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(media).setScale(2, RoundingMode.HALF_UP));
        usuarioRepository.save(avaliado);
    }

    private Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", email));
    }

    private Usuario buscarUsuario(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Usuário", id));
    }

    private Anuncio buscarAnuncio(UUID id) {
        return anuncioRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Anúncio", id));
    }

    private AvaliacaoRespostaDTO mapear(Avaliacao avaliacao) {
        return new AvaliacaoRespostaDTO(
                avaliacao.getId(),
                avaliacao.getAvaliador().getId(),
                avaliacao.getAvaliador().getName(),
                avaliacao.getAvaliado().getId(),
                avaliacao.getAvaliado().getName(),
                avaliacao.getAnuncio().getId(),
                avaliacao.getAnuncio().getTitulo(),
                avaliacao.getNota(),
                avaliacao.getComentario(),
                avaliacao.getCriadoEm()
        );
    }
}
