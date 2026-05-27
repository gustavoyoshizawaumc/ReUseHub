import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";
import { denunciarAnuncio } from "../../services/denunciaService";

interface DenunciaAnuncioModalProps {
  open: boolean;
  onClose: () => void;
  anuncioId: string;
  anuncioTitulo: string;
}

const MOTIVOS = [
  "Conteudo inadequado",
  "Produto proibido",
  "Informacoes falsas",
  "Suspeita de golpe",
  "Outro motivo",
];

export const DenunciaAnuncioModal: React.FC<DenunciaAnuncioModalProps> = ({
  open,
  onClose,
  anuncioId,
  anuncioTitulo,
}) => {
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  if (!open) return null;

  const handleClose = () => {
    setErro(null);
    setEnviado(false);
    setDescricao("");
    setMotivo(MOTIVOS[0]);
    onClose();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setErro(null);

    try {
      await denunciarAnuncio({
        anuncioId,
        motivo,
        descricao: descricao.trim() || undefined,
      });
      setEnviado(true);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Nao foi possivel enviar a denuncia.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
          <div>
            <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
              {enviado ? <CheckCircle2 size={22} /> : <AlertTriangle size={22} />}
            </div>
            <h2 className="text-xl font-extrabold text-slate-950">
              {enviado ? "Denuncia enviada" : "Denunciar anuncio"}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {enviado
                ? "Obrigado. A moderacao vai analisar este anuncio."
                : `Informe o problema encontrado em "${anuncioTitulo}".`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-700"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>

        {enviado ? (
          <div className="p-5">
            <button
              type="button"
              onClick={handleClose}
              className="w-full rounded-lg bg-reusehub-blue py-3 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              Entendi
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 p-5">
            {erro && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {erro}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Motivo
              </label>
              <select
                value={motivo}
                onChange={(event) => setMotivo(event.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all focus:border-reusehub-blue focus:bg-white focus:ring-4 focus:ring-blue-50"
              >
                {MOTIVOS.map((opcao) => (
                  <option key={opcao} value={opcao}>
                    {opcao}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                Detalhes
              </label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Descreva o que parece inadequado ou suspeito."
                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-reusehub-blue focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                Enviar denuncia
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
