import React, { useEffect, useMemo, useState } from "react";
import { Header } from "../../components/Header";
import { HeroBanner } from "../../components/HeroBanner";
import { Footer } from "../../components/Footer";
import { ProductSection } from "../../components/ProductSection";
import { EmptyStateHome } from "../../components/EmptyStateHome";
import { HomeSkeleton } from "../../components/HomeSkeleton";
import { ErroAoCarregarHome } from "../../components/ErroAoCarregarHome";
import { useBootstrapHome } from "../../hooks/useBootstrapHome";
import { useUltimasBuscasComAnuncios } from "../../hooks/useUltimasBuscasComAnuncios";
import { buscarComFiltros } from "../../services/anuncioService";
import {
  EVENTO_FILTRO_LOCALIZACAO,
  type FiltroLocalizacaoSessao,
  obterFiltroLocalizacaoSessao,
} from "../../utils/filtroLocalizacao";
import type {
  Anuncio,
  AnuncioDestaque,
  BootstrapHome,
  ContextoDestaque,
  SecaoHome,
} from "../../types/anuncio.types";

const TITULO_SECAO_ULTIMAS_BUSCAS = "Baseado em suas últimas buscas";
const CONTEXTO_RECOMENDADOS: ContextoDestaque = "RECOMENDADOS_PARA_VOCE";
const LIMITE_SECOES_PRINCIPAIS = 4;
const LIMITE_SECOES_GERAIS = 6;

export const HomePage: React.FC = () => {
  const { dados, carregando, erro } = useBootstrapHome();
  const ultimasBuscas = useUltimasBuscasComAnuncios();
  const [filtroCep, setFiltroCep] = useState(() => obterFiltroLocalizacaoSessao());
  const chaveFiltroCep = filtroCep ? `${filtroCep.cep}-${filtroCep.raioKm}` : null;
  const [resultadoCep, setResultadoCep] = useState<ResultadoCepHome | null>(null);

  const secoesParaRenderizar = useMemo(
    () => mesclarSecoes(dados, ultimasBuscas.dados),
    [dados, ultimasBuscas.dados]
  );

  useEffect(() => {
    if (!filtroCep) {
      return;
    }

    let cancelado = false;

    buscarComFiltros(
      {
        cep: filtroCep.cep,
        raioKm: filtroCep.raioKm,
        ordenacao: "DISTANCIA",
      },
      0,
      120
    )
      .then((resposta) => {
        if (cancelado) return;
        setResultadoCep({
          chave: chaveFiltroCep,
          anuncios: resposta.content.map(transformarEmDestaque),
          erro: null,
        });
      })
      .catch((err) => {
        if (cancelado) return;
        setResultadoCep({
          chave: chaveFiltroCep,
          anuncios: [],
          erro: obterMensagemErro(err),
        });
      });

    return () => {
      cancelado = true;
    };
  }, [chaveFiltroCep, filtroCep]);

  useEffect(() => {
    const sincronizarFiltro = () => {
      setFiltroCep(obterFiltroLocalizacaoSessao());
    };

    window.addEventListener(EVENTO_FILTRO_LOCALIZACAO, sincronizarFiltro);
    window.addEventListener("storage", sincronizarFiltro);

    return () => {
      window.removeEventListener(EVENTO_FILTRO_LOCALIZACAO, sincronizarFiltro);
      window.removeEventListener("storage", sincronizarFiltro);
    };
  }, []);

  const resultadoCepAtual = resultadoCep?.chave === chaveFiltroCep ? resultadoCep : null;
  const carregandoCep = Boolean(chaveFiltroCep && !resultadoCepAtual);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <h1 className="sr-only">
          ReUseHub - plataforma de doação e troca de itens usados
        </h1>
        <HeroBanner />
        <ConteudoHome
          dados={dados}
          carregando={carregando}
          erro={erro}
          secoes={secoesParaRenderizar}
          filtroCep={filtroCep}
          anunciosPorCep={resultadoCepAtual?.anuncios ?? []}
          carregandoCep={carregandoCep}
          erroCep={resultadoCepAtual?.erro ?? null}
        />
      </main>
      <Footer />
    </div>
  );
};

interface ConteudoHomeProps {
  dados: BootstrapHome | null;
  carregando: boolean;
  erro: string | null;
  secoes: SecaoHome[];
  filtroCep: FiltroLocalizacaoSessao | null;
  anunciosPorCep: AnuncioDestaque[];
  carregandoCep: boolean;
  erroCep: string | null;
}

const ConteudoHome: React.FC<ConteudoHomeProps> = ({
  dados,
  carregando,
  erro,
  secoes,
  filtroCep,
  anunciosPorCep,
  carregandoCep,
  erroCep,
}) => {
  if (filtroCep) {
    if (carregandoCep || (carregando && !dados)) {
      return <HomeSkeleton />;
    }

    if (erroCep) {
      return <ErroAoCarregarHome mensagem={erroCep} />;
    }

    const secoesFiltradas = filtrarSecoesPorAnuncios(secoes, anunciosPorCep);

    if (secoesFiltradas.length === 0) {
      return <EmptyStateHome />;
    }

    return <SecoesHome secoes={secoesFiltradas} />;
  }

  if (carregando && !dados) {
    return <HomeSkeleton />;
  }

  if (erro && !dados) {
    return <ErroAoCarregarHome mensagem={erro} />;
  }

  if (secoes.length === 0) {
    return <EmptyStateHome />;
  }

  return <SecoesHome secoes={secoes} />;
};

const SecoesHome: React.FC<{ secoes: SecaoHome[] }> = ({ secoes }) => (
  <div className="space-y-2 pb-8 sm:space-y-3 sm:pb-12">
    {secoes.map((secao) => (
      <ProductSection
        key={`${secao.contexto}-${secao.categoriaId ?? "sem-cat"}-${secao.titulo}`}
        titulo={secao.titulo}
        subtitulo={obterSubtituloSecao(secao)}
        anuncios={secao.anuncios}
        linkVerTodos={secao.linkVerTodos}
        variante={obterVarianteSecao(secao)}
      />
    ))}
  </div>
);

function mesclarSecoes(
  bootstrap: BootstrapHome | null,
  anunciosDeUltimasBuscas: AnuncioDestaque[]
): SecaoHome[] {
  const secoesDoBackend = bootstrap?.secoes ?? [];

  if (anunciosDeUltimasBuscas.length === 0) {
    return prepararSecoesHome(secoesDoBackend);
  }

  const secaoUltimasBuscas = construirSecaoUltimasBuscas(anunciosDeUltimasBuscas);
  const indiceDeInsercao = calcularIndiceDeInsercao(secoesDoBackend);

  return prepararSecoesHome([
    ...secoesDoBackend.slice(0, indiceDeInsercao),
    secaoUltimasBuscas,
    ...secoesDoBackend.slice(indiceDeInsercao),
  ]);
}

function construirSecaoUltimasBuscas(anuncios: AnuncioDestaque[]): SecaoHome {
  return {
    contexto: "ULTIMAS_BUSCAS",
    categoriaId: null,
    titulo: TITULO_SECAO_ULTIMAS_BUSCAS,
    linkVerTodos: null,
    anuncios,
  };
}

function calcularIndiceDeInsercao(secoes: SecaoHome[]): number {
  const indiceRecomendados = secoes.findIndex(
    (secao) => secao.contexto === CONTEXTO_RECOMENDADOS
  );
  return indiceRecomendados === -1 ? 0 : indiceRecomendados + 1;
}

function filtrarSecoesPorAnuncios(
  secoes: SecaoHome[],
  anunciosPermitidos: AnuncioDestaque[]
): SecaoHome[] {
  const idsPermitidos = new Set(
    anunciosPermitidos.map((item) => item.anuncio.id)
  );

  return secoes
    .map((secao) => ({
      ...secao,
      anuncios: secao.anuncios.filter((item) =>
        idsPermitidos.has(item.anuncio.id)
      ),
    }))
    .filter((secao) => secao.anuncios.length > 0);
}

function prepararSecoesHome(secoes: SecaoHome[]): SecaoHome[] {
  const anunciosJaExibidos = new Set<string>();

  return secoes
    .map((secao) => {
      const limite =
        secao.contexto === "ULTIMAS_BUSCAS" || secao.contexto === CONTEXTO_RECOMENDADOS
          ? LIMITE_SECOES_PRINCIPAIS
          : LIMITE_SECOES_GERAIS;

      const anuncios = secao.anuncios
        .filter((item) => {
          const id = item.anuncio.id;
          if (anunciosJaExibidos.has(id)) return false;
          anunciosJaExibidos.add(id);
          return true;
        })
        .slice(0, limite);

      return {
        ...secao,
        anuncios,
      };
    })
    .filter((secao) => secao.anuncios.length > 0);
}

function obterVarianteSecao(secao: SecaoHome): "destaque" | "padrao" {
  return secao.contexto === "ULTIMAS_BUSCAS" || secao.contexto === CONTEXTO_RECOMENDADOS
    ? "destaque"
    : "padrao";
}

function obterSubtituloSecao(secao: SecaoHome): string {
  if (secao.contexto === "ULTIMAS_BUSCAS") {
    return "Itens relacionados ao que você pesquisou recentemente.";
  }

  if (secao.contexto === CONTEXTO_RECOMENDADOS) {
    return "Sugestões montadas a partir dos seus favoritos e interações.";
  }

  if (secao.contexto === "MAIS_PROCURADOS") {
    return "Uma curadoria da categoria em destaque no momento.";
  }

  if (secao.contexto === "POPULARES") {
    return "Anúncios com mais visualizações e maior movimento na plataforma.";
  }

  return "Novidades publicadas recentemente pela comunidade.";
}

interface ResultadoCepHome {
  chave: string | null;
  anuncios: AnuncioDestaque[];
  erro: string | null;
}

function transformarEmDestaque(anuncio: Anuncio): AnuncioDestaque {
  return {
    anuncio,
    scoreDestaque: null,
  };
}

function obterMensagemErro(err: unknown): string {
  if (typeof err === "object" && err && "response" in err) {
    const response = (err as { response?: { data?: { mensagem?: string; message?: string } } }).response;
    return response?.data?.mensagem ?? response?.data?.message ?? "Não foi possível filtrar anúncios por localização.";
  }

  return err instanceof Error ? err.message : "Não foi possível filtrar anúncios por localização.";
}
