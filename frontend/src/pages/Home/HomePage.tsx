import React from "react";
import { Header } from "../../components/Header";
import { HeroBanner } from "../../components/HeroBanner";
import { Footer } from "../../components/Footer";
import { ProductSection } from "../../components/ProductSection";
import { EmptyStateHome } from "../../components/EmptyStateHome";
import { HomeSkeleton } from "../../components/HomeSkeleton";
import { ErroAoCarregarHome } from "../../components/ErroAoCarregarHome";
import { useBootstrapHome } from "../../hooks/useBootstrapHome";
import type { BootstrapHome } from "../../types/anuncio.types";

export const HomePage: React.FC = () => {
  const { dados, carregando, erro } = useBootstrapHome();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <HeroBanner />
        <ConteudoHome dados={dados} carregando={carregando} erro={erro} />
      </main>
      <Footer />
    </div>
  );
};

interface ConteudoHomeProps {
  dados: BootstrapHome | null;
  carregando: boolean;
  erro: string | null;
}

const ConteudoHome: React.FC<ConteudoHomeProps> = ({ dados, carregando, erro }) => {
  if (carregando && !dados) {
    return <HomeSkeleton />;
  }

  if (erro && !dados) {
    return <ErroAoCarregarHome mensagem={erro} />;
  }

  if (!dados || dados.secoes.length === 0) {
    return <EmptyStateHome />;
  }

  return (
    <>
      {dados.secoes.map((secao) => (
        <ProductSection
          key={`${secao.contexto}-${secao.categoriaId ?? "sem-cat"}`}
          titulo={secao.titulo}
          anuncios={secao.anuncios}
          linkVerTodos={secao.linkVerTodos}
        />
      ))}
    </>
  );
};
