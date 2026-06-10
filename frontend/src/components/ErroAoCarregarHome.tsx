import React from "react";
import { AlertCircle } from "lucide-react";

interface ErroAoCarregarHomeProps {
  mensagem: string;
}

export const ErroAoCarregarHome: React.FC<ErroAoCarregarHomeProps> = ({ mensagem }) => (
  <section className="max-w-[700px] mx-auto px-4 py-16 text-center">
    <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
      <AlertCircle size={32} />
    </div>
    <h2 className="mb-3 text-2xl font-extrabold text-slate-900">
      Nao foi possivel carregar os destaques
    </h2>
    <p className="mb-8 text-slate-500">{mensagem}</p>
    <button
      type="button"
      onClick={() => window.location.reload()}
      className="rounded-lg bg-blue-600 px-6 py-3 font-bold text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
    >
      Tentar novamente
    </button>
  </section>
);
