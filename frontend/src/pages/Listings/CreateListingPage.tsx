import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Gift, ArrowLeftRight } from "lucide-react";

const CONDITIONS = [
  { value: "NEW", label: "Novo" },
  { value: "GOOD", label: "Bom" },
  { value: "FAIR", label: "Usado" },
  { value: "POOR", label: "Avariado" },
];

export const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();

  const [type, setType] = useState<"DONATION" | "TRADE">("DONATION");
  const [condition, setCondition] = useState("GOOD");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigate("/anuncios");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-plus-jakarta-sans">
      <Header />
      <main className="max-w-[800px] mx-auto px-4 pt-12 pb-24 flex-grow w-full">
        <div className="text-center mb-12">
          <h1 className="text-[32px] font-bold text-[#1e293b] tracking-tight">
            Criar novo anúncio
          </h1>
          <p className="text-slate-500 mt-2 text-[16px]">
            Preencha os dados do item que você deseja desapegar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-10 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-orange-500 rounded-full" />
              Informações Gerais
            </h2>

            <div className="space-y-10 text-center">
              <div>
                <label className="block text-[11px] font-semibold text-slate-800 mb-4 uppercase tracking-[1px]">
                  VOCÊ QUER DOAR OU TROCAR?
                </label>
                <div className="flex gap-4 max-w-[500px] mx-auto">
                  <button
                    type="button"
                    onClick={() => setType("DONATION")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                      type === "DONATION"
                        ? "border-emerald-400 bg-emerald-50 text-emerald-600 shadow-sm"
                        : "border-slate-100 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <Gift
                      size={20}
                      className={
                        type === "DONATION"
                          ? "text-emerald-500"
                          : "text-slate-400"
                      }
                    />
                    Doação
                  </button>
                  <button
                    type="button"
                    onClick={() => setType("TRADE")}
                    className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-bold border-2 transition-all ${
                      type === "TRADE"
                        ? "border-blue-400 bg-blue-50 text-blue-600 shadow-sm"
                        : "border-slate-100 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    <ArrowLeftRight
                      size={20}
                      className={
                        type === "TRADE" ? "text-blue-500" : "text-slate-400"
                      }
                    />
                    Troca
                  </button>
                </div>
              </div>

              <div className="max-w-[600px] mx-auto w-full">
                <label className="block text-[11px] font-semibold text-slate-800 mb-3 uppercase tracking-[1px]">
                  TÍTULO DO ANÚNCIO
                </label>
                <input
                  required
                  type="text"
                  placeholder="Ex: Bicicleta Aro 29 seminova"
                  className="w-full px-5 py-3 text-[16px] bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all text-center placeholder:text-slate-300"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-[600px] mx-auto">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-3 uppercase tracking-[1px]">
                    CATEGORIA
                  </label>
                  <select className="w-full px-5 py-3 text-[16px] bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white appearance-none text-center cursor-pointer">
                    <option>Móveis</option>
                    <option>Eletrônicos</option>
                    <option>Roupas</option>
                    <option>Livros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-800 mb-3 uppercase tracking-[1px]">
                    CONDIÇÃO DO ITEM
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-5 py-3 text-[16px] bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white appearance-none text-center cursor-pointer"
                  >
                    {CONDITIONS.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full" />
              Fotos do produto
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[600px] mx-auto">
              <label className="aspect-square rounded-[24px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-all group">
                <span className="text-3xl text-slate-300 group-hover:text-blue-500 transition-colors">
                  +
                </span>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase mt-1">
                  ADICIONAR
                </span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                />
              </label>

              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-square rounded-[24px] bg-slate-50/50 border border-slate-100"
                />
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-8 text-center uppercase tracking-wider">
              💡 Dica: Anúncios com fotos reais recebem 3x mais propostas.
            </p>
          </div>

          <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100">
            <h2 className="text-base font-semibold text-slate-800 mb-8 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-emerald-500 rounded-full" />
              Descrição e Localização
            </h2>

            <div className="space-y-8 text-center max-w-[600px] mx-auto">
              <div>
                <label className="block text-[11px] font-semibold text-slate-800 mb-3 uppercase tracking-[1px]">
                  DESCRIÇÃO DETALHADA
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Conte mais sobre o item. Se for troca, diga o que você busca..."
                  className="w-full px-5 py-3 text-[16px] bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-100 focus:bg-white outline-none transition-all resize-none text-center"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-800 mb-3 uppercase tracking-[1px]">
                  CEP DA RETIRADA
                </label>
                <div className="flex gap-4 max-w-[350px] mx-auto items-center">
                  <input
                    required
                    type="text"
                    placeholder="00000-000"
                    className="flex-1 px-5 py-3 text-[16px] bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 text-center"
                  />
                  <button
                    type="button"
                    className="text-blue-600 font-extrabold text-sm hover:text-blue-700 transition-colors"
                  >
                    Validar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-10 pt-10 pb-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="text-slate-500 font-bold hover:text-slate-800 transition-colors order-2 sm:order-1"
            >
              Cancelar e voltar
            </button>
            <button
              disabled={loading}
              type="submit"
              className={`w-full sm:w-[380px] py-4 bg-orange-500 text-white font-bold rounded-[20px] shadow-lg shadow-orange-100 transition-all order-1 sm:order-2 ${
                loading
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:bg-orange-600 hover:-translate-y-1 active:translate-y-0"
              }`}
            >
              {loading ? "Publicando..." : "Publicar anúncio gratuito"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};
