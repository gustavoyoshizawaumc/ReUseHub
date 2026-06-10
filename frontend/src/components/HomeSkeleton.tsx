import React from "react";

const QUANTIDADE_SECOES_SKELETON = 2;
const QUANTIDADE_CARDS_POR_SECAO = 6;

export const HomeSkeleton: React.FC = () => (
  <>
    {Array.from({ length: QUANTIDADE_SECOES_SKELETON }).map((_, indiceSecao) => (
      <section
        key={indiceSecao}
        className="max-w-[1400px] mx-auto px-3 py-7 sm:px-4 sm:py-10"
      >
        <div className="mb-4 h-5 w-56 rounded bg-slate-200 animate-pulse sm:mb-6" />
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
          {Array.from({ length: QUANTIDADE_CARDS_POR_SECAO }).map((_, indiceCard) => (
            <div
              key={indiceCard}
              className="overflow-hidden rounded-lg border border-slate-200 bg-white"
            >
              <div className="aspect-square w-full animate-pulse bg-slate-100" />
              <div className="space-y-2 px-3 py-3 sm:px-4">
                <div className="h-3 w-3/4 animate-pulse rounded bg-slate-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </section>
    ))}
  </>
);
