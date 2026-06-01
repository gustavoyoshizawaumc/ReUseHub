package com.reusehub.anuncio.destaque.service;

import com.reusehub.anuncio.destaque.dto.AnuncioDestaqueDTO;
import com.reusehub.anuncio.destaque.dto.BootstrapHomeDTO;
import com.reusehub.anuncio.destaque.dto.CategoriaEmDestaqueDTO;
import com.reusehub.anuncio.destaque.dto.SecaoHomeDTO;
import com.reusehub.anuncio.destaque.enums.CenarioHome;
import com.reusehub.anuncio.destaque.enums.ContextoDestaque;
import com.reusehub.anuncio.repository.AnuncioFavoritoRepository;
import com.reusehub.auth.model.Usuario;
import com.reusehub.auth.repository.UsuarioRepository;
import com.reusehub.interesse.repository.InteresseTrocaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Fonte da verdade da home: detecta o cenario do usuario corrente, escolhe a
 * categoria em destaque, monta as secoes apropriadas (ja populadas com dados)
 * e omite as que viriam vazias.
 *
 * <p>O frontend nao precisa de regra de negocio - apenas itera o array
 * {@code secoes} e renderiza cada uma com o {@code titulo} e
 * {@code linkVerTodos} ja calculados aqui.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BootstrapHomeService {

    private final UsuarioRepository usuarioRepository;
    private final AnuncioFavoritoRepository anuncioFavoritoRepository;
    private final InteresseTrocaRepository interesseTrocaRepository;
    private final CategoriaEmDestaqueService categoriaEmDestaqueService;
    private final AnuncioDestaqueService anuncioDestaqueService;

    /**
     * Sobrescrita do clock para testabilidade do tempo (data da rotacao).
     * Em producao usa o relogio do sistema na zona padrao.
     */
    private final Clock clock = Clock.systemDefaultZone();

    /**
     * @param emailUsuarioAutenticado {@code null} para visitantes anonimos.
     */
    public BootstrapHomeDTO montarReceita(String emailUsuarioAutenticado) {
        Optional<Usuario> usuarioOpcional = Optional.ofNullable(emailUsuarioAutenticado)
                .flatMap(usuarioRepository::findByEmail);

        CenarioHome cenario = detectarCenario(usuarioOpcional);
        LocalDate dataRotacao = LocalDate.now(clock);

        Optional<CategoriaEmDestaqueDTO> categoriaEmDestaque = obterCategoriaEmDestaque(
                cenario, usuarioOpcional, dataRotacao
        );

        List<SecaoHomeDTO> secoes = montarSecoes(
                cenario,
                categoriaEmDestaque,
                usuarioOpcional.map(Usuario::getId).orElse(null)
        );

        return new BootstrapHomeDTO(
                cenario,
                categoriaEmDestaque.orElse(null),
                secoes,
                Instant.now(clock),
                dataRotacao
        );
    }

    // -- Deteccao de cenario -------------------------------------------------

    private CenarioHome detectarCenario(Optional<Usuario> usuarioOpcional) {
        if (usuarioOpcional.isEmpty()) {
            return CenarioHome.ANONIMO;
        }
        UUID usuarioId = usuarioOpcional.get().getId();
        long historico = anuncioFavoritoRepository.countByUsuarioId(usuarioId)
                + interesseTrocaRepository.countByInteressadoId(usuarioId);
        return historico >= ConfiguracaoDestaque.MINIMO_HISTORICO
                ? CenarioHome.HISTORICO_USUARIO
                : CenarioHome.SEM_HISTORICO;
    }

    // -- Categoria em destaque -----------------------------------------------

    private Optional<CategoriaEmDestaqueDTO> obterCategoriaEmDestaque(
            CenarioHome cenario,
            Optional<Usuario> usuarioOpcional,
            LocalDate dataRotacao
    ) {
        if (cenario == CenarioHome.HISTORICO_USUARIO && usuarioOpcional.isPresent()) {
            Optional<CategoriaEmDestaqueDTO> pessoal =
                    categoriaEmDestaqueService.obterParaUsuarioComHistorico(usuarioOpcional.get().getId());
            if (pessoal.isPresent()) {
                return pessoal;
            }
        }
        return categoriaEmDestaqueService.obterRotativaDoDia(dataRotacao);
    }

    // -- Montagem das secoes -------------------------------------------------

    private List<SecaoHomeDTO> montarSecoes(
            CenarioHome cenario,
            Optional<CategoriaEmDestaqueDTO> categoriaEmDestaque,
            UUID usuarioId
    ) {
        List<SecaoHomeDTO> secoes = new ArrayList<>();

        if (cenario == CenarioHome.HISTORICO_USUARIO) {
            adicionarSeNaoVazia(secoes, montarSecaoRecomendados(usuarioId));
            categoriaEmDestaque.ifPresent(cat ->
                    adicionarSeNaoVazia(secoes, montarSecaoMaisProcurados(cat, usuarioId))
            );
            return secoes;
        }

        // SEM_HISTORICO e ANONIMO compartilham a mesma estrutura
        categoriaEmDestaque.ifPresent(cat ->
                adicionarSeNaoVazia(secoes, montarSecaoMaisProcurados(cat, usuarioId))
        );
        adicionarSeNaoVazia(secoes, montarSecaoPopulares());
        adicionarSeNaoVazia(secoes, montarSecaoRecentes());

        return secoes;
    }

    private void adicionarSeNaoVazia(List<SecaoHomeDTO> destino, SecaoHomeDTO secao) {
        if (secao != null && !secao.anuncios().isEmpty()) {
            destino.add(secao);
        }
    }

    private SecaoHomeDTO montarSecaoRecomendados(UUID usuarioId) {
        List<AnuncioDestaqueDTO> anuncios = anuncioDestaqueService.obterDestaques(
                ContextoDestaque.RECOMENDADOS_PARA_VOCE,
                null,
                ConfiguracaoDestaque.SIZE_RECOMENDADOS,
                usuarioId
        );
        return new SecaoHomeDTO(
                ContextoDestaque.RECOMENDADOS_PARA_VOCE,
                null,
                "Baseado nos seus favoritos",
                null,
                anuncios
        );
    }

    private SecaoHomeDTO montarSecaoMaisProcurados(CategoriaEmDestaqueDTO categoria, UUID usuarioId) {
        List<AnuncioDestaqueDTO> anuncios = anuncioDestaqueService.obterDestaques(
                ContextoDestaque.MAIS_PROCURADOS,
                categoria.id(),
                ConfiguracaoDestaque.DEFAULT_SIZE,
                usuarioId
        );
        return new SecaoHomeDTO(
                ContextoDestaque.MAIS_PROCURADOS,
                categoria.id(),
                "Mais procurados em " + categoria.nome(),
                "/anuncios?categoriaId=" + categoria.id() + "&ordenacao=POPULARES",
                anuncios
        );
    }

    private SecaoHomeDTO montarSecaoPopulares() {
        List<AnuncioDestaqueDTO> anuncios = anuncioDestaqueService.obterDestaques(
                ContextoDestaque.POPULARES,
                null,
                ConfiguracaoDestaque.DEFAULT_SIZE,
                null
        );
        return new SecaoHomeDTO(
                ContextoDestaque.POPULARES,
                null,
                "Anuncios populares",
                "/anuncios?ordenacao=POPULARES",
                anuncios
        );
    }

    private SecaoHomeDTO montarSecaoRecentes() {
        List<AnuncioDestaqueDTO> anuncios = anuncioDestaqueService.obterDestaques(
                ContextoDestaque.RECENTES,
                null,
                ConfiguracaoDestaque.DEFAULT_SIZE,
                null
        );
        return new SecaoHomeDTO(
                ContextoDestaque.RECENTES,
                null,
                "Anuncios recentes",
                "/anuncios?ordenacao=RECENTES",
                anuncios
        );
    }
}
