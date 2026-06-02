import React, { useMemo } from "react";
import { Header } from "../../components/Header";
import { HeroBanner } from "../../components/HeroBanner";
import { Footer } from "../../components/Footer";
import { ProductSection } from "../../components/ProductSection";
import { EmptyStateHome } from "../../components/EmptyStateHome";
import { HomeSkeleton } from "../../components/HomeSkeleton";
import { ErroAoCarregarHome } from "../../components/ErroAoCarregarHome";
import { useBootstrapHome } from "../../hooks/useBootstrapHome";
import { useUltimasBuscasComAnuncios } from "../../hooks/useUltimasBuscasComAnuncios";
import type {
  AnuncioDestaque,
  BootstrapHome,
  ContextoDestaque,
  SecaoHome,
} from "../../types/anuncio.types";

const TITULO_SECAO_ULTIMAS_BUSCAS = "Baseado em suas últimas buscas";
const CONTEXTO_RECOMENDADOS: ContextoDestaque = "RECOMENDADOS_PARA_VOCE";

export const HomePage: React.FC = () => {
  const { dados, carregando, erro } = useBootstrapHome();
  const ultimasBuscas = useUltimasBuscasComAnuncios();

  const secoesParaRenderizar = useMemo(
    () => mesclarSecoes(dados, ultimasBuscas.dados),
    [dados, ultimasBuscas.dados]
  );

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
}

const ConteudoHome: React.FC<ConteudoHomeProps> = ({ dados, carregando, erro, secoes }) => {
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
 *  1. Baseado nos seus favoritos (RECOMENDADOS_PARA_VOCE) — quando existir
 *  2. Baseado em suas ultimas buscas — quando o usuario tiver historico local
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
