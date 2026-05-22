import React from "react";
import { Header } from "../../components/Header";
import { HeroBanner } from "../../components/HeroBanner";
import { ProductSection } from "../../components/ProductSection";
import { mockFurniture, mockBooks } from "../../data/mocks";
import { Footer } from "../../components/Footer";

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <main>
        <HeroBanner />
        <ProductSection
          title="Mais procurados em Móveis"
          products={mockFurniture}
        />
        <ProductSection
          title="Mais procurados em Livros e Educação"
          products={mockBooks}
        />
      </main>
      <Footer />
    </div>
  );
};
