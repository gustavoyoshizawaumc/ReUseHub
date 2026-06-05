import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
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
import type {
  Anuncio,
  AnuncioDestaque,
  BootstrapHome,
  ContextoDestaque,
  SecaoHome,
} from "../../types/anuncio.types";

const TITULO_SECAO_ULTIMAS_BUSCAS = "Baseado em suas Ãºltimas buscas";
const CONTEXTO_RECOMENDADOS: ContextoDestaque = "RECOMENDADOS_PARA_VOCE";

export const HomePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { dados, carregando, erro } = useBootstrapHome();
  const ultimasBuscas = useUltimasBuscasComAnuncios();
  const filtroCep = useMemo(() => extrairFiltroCepDaUrl(searchParams), [searchParams]);
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

  const resultadoCepAtual = resultadoCep?.chave === chaveFiltroCep ? resultadoCep : null;
  const carregandoCep = Boolean(chaveFiltroCep && !resultadoCepAtual);

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
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
  filtroCep: FiltroCepHome | null;
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

    return (
      <>
        {secoesFiltradas.map((secao) => (
          <ProductSection
            key={`${secao.contexto}-${secao.categoriaId ?? "sem-cat"}-${secao.titulo}`}
            titulo={secao.titulo}
            anuncios={secao.anuncios}
            linkVerTodos={secao.linkVerTodos}
          />
        ))}
      </>
    );
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

  return (
    <>
      {secoes.map((secao) => (
        <ProductSection
          key={`${secao.contexto}-${secao.categoriaId ?? "sem-cat"}-${secao.titulo}`}
          titulo={secao.titulo}
          anuncios={secao.anuncios}
          linkVerTodos={secao.linkVerTodos}
        />
      ))}
    </>
  );
};

/**
 * Combina secoes server-driven (bootstrap-home) com a secao client-driven
 * de ultimas buscas. A ordem desejada e:
 *
 *  1. Baseado nos seus favoritos (RECOMENDADOS_PARA_VOCE) â€” quando existir
 *  2. Baseado em suas ultimas buscas â€” quando o usuario tiver historico local
 *  3. Demais secoes do backend (MAIS_PROCURADOS, POPULARES, RECENTES)
 *
 * Quando RECOMENDADOS_PARA_VOCE nao estiver presente (anonimo / sem historico
 * de favoritos), a secao de ultimas buscas vai pro topo. Secoes vazias nao
 * sao incluidas (mesma regra do backend).
 */
function mesclarSecoes(
  bootstrap: BootstrapHome | null,
  anunciosDeUltimasBuscas: AnuncioDestaque[]
): SecaoHome[] {
  const secoesDoBackend = bootstrap?.secoes ?? [];

  if (anunciosDeUltimasBuscas.length === 0) {
    return secoesDoBackend;
  }

  const secaoUltimasBuscas = construirSecaoUltimasBuscas(anunciosDeUltimasBuscas);
  const indiceDeInsercao = calcularIndiceDeInsercao(secoesDoBackend);

  return [
    ...secoesDoBackend.slice(0, indiceDeInsercao),
    secaoUltimasBuscas,
    ...secoesDoBackend.slice(indiceDeInsercao),
  ];
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

interface FiltroCepHome {
  cep: string;
  raioKm: number;
}

interface ResultadoCepHome {
  chave: string | null;
  anuncios: AnuncioDestaque[];
  erro: string | null;
}

function extrairFiltroCepDaUrl(searchParams: URLSearchParams): FiltroCepHome | null {
  const cep = searchParams.get("cep")?.replace(/\D/g, "") ?? "";
  if (cep.length !== 8) return null;

  const raioUrl = Number(searchParams.get("raioKm"));
  const raioKm = [5, 10, 25, 50, 100].includes(raioUrl) ? raioUrl : 10;

  return { cep, raioKm };
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
    return response?.data?.mensagem ?? response?.data?.message ?? "NÃ£o foi possÃ­vel filtrar anÃºncios por localizaÃ§Ã£o.";
  }

  return err instanceof Error ? err.message : "NÃ£o foi possÃ­vel filtrar anÃºncios por localizaÃ§Ã£o.";
}

