import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Camera, GripVertical, PlusCircle, Star, X } from "lucide-react";
import type { ImagemAnuncio } from "../types/anuncio.types";

const QUANTIDADE_MINIMA_IMAGENS = 3;
const QUANTIDADE_MAXIMA_IMAGENS = 5;
const PREFIXO_NOVA_IMAGEM = "nova:";

interface ItemDeImagem {
  /** Chave estavel para o dnd-kit. Para existentes e o id; para novas, `nova:<indice>`. */
  chave: string;
  url: string;
  /** id da imagem existente (UUID) ou null caso seja uma nova imagem ainda nao salva. */
  idExistente: string | null;
  /** Arquivo a ser enviado quando se tratar de uma nova imagem. */
  arquivoNovo: File | null;
}

export interface SelecaoDeImagens {
  idsParaManter: string[];
  novasImagens: File[];
  totalFinal: number;
}

interface GerenciadorDeImagensProps {
  imagensExistentes: ImagemAnuncio[];
  /** Chamado a cada mudanca (drag, add, remove) com a selecao atualizada. */
  onSelecaoMudou: (selecao: SelecaoDeImagens) => void;
}

export const GerenciadorDeImagens: React.FC<GerenciadorDeImagensProps> = ({
  imagensExistentes,
  onSelecaoMudou,
}) => {
  const [itens, setItens] = useState<ItemDeImagem[]>(() =>
    mapearExistentesParaItens(imagensExistentes)
  );

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const chavesParaSortable = useMemo(() => itens.map((item) => item.chave), [itens]);
  const erroQuantidade = useMemo(() => calcularErroDeQuantidade(itens.length), [itens.length]);

  useEffect(() => {
    onSelecaoMudou(construirSelecao(itens));
    // onSelecaoMudou deve ser estabilizada via useCallback no consumidor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens]);

  // Libera as object URLs criadas localmente quando o componente sai de tela.
  useEffect(() => {
    return () => {
      itens
        .filter((item) => item.arquivoNovo !== null)
        .forEach((item) => URL.revokeObjectURL(item.url));
    };
    // Apenas no unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const aoSoltarItemArrastado = (evento: DragEndEvent) => {
    const { active, over } = evento;
    if (!over || active.id === over.id) {
      return;
    }
    setItens((anteriores) => {
      const origem = anteriores.findIndex((item) => item.chave === active.id);
      const destino = anteriores.findIndex((item) => item.chave === over.id);
      if (origem === -1 || destino === -1) {
        return anteriores;
      }
      return arrayMove(anteriores, origem, destino);
    });
  };

  const adicionarNovasImagens = (arquivos: FileList | null) => {
    if (!arquivos || arquivos.length === 0) {
      return;
    }
    const espacoDisponivel = QUANTIDADE_MAXIMA_IMAGENS - itens.length;
    if (espacoDisponivel <= 0) {
      return;
    }
    const arquivosSelecionados = Array.from(arquivos).slice(0, espacoDisponivel);
    setItens((anteriores) => [
      ...anteriores,
      ...arquivosSelecionados.map((arquivo, indice) => criarItemDeNovaImagem(arquivo, anteriores.length + indice)),
    ]);
  };

  const removerItem = (chave: string) => {
    setItens((anteriores) => {
      const itemRemovido = anteriores.find((item) => item.chave === chave);
      if (itemRemovido?.arquivoNovo) {
        URL.revokeObjectURL(itemRemovido.url);
      }
      return anteriores.filter((item) => item.chave !== chave);
    });
  };

  const podeAdicionarMais = itens.length < QUANTIDADE_MAXIMA_IMAGENS;
  const corBadge = itens.length >= QUANTIDADE_MINIMA_IMAGENS
    ? "bg-emerald-100 text-emerald-700"
    : "bg-amber-100 text-amber-700";

  return (
    <div className="space-y-4 pt-6 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <label className="text-sm font-extrabold text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Camera size={18} className="text-blue-600" />
          Fotos do Produto
        </label>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${corBadge}`}>
          {itens.length}/{QUANTIDADE_MAXIMA_IMAGENS}
        </span>
      </div>

      <p className="text-xs text-slate-500 font-medium">
        Arraste para reordenar. A primeira imagem sera a capa do anuncio.
      </p>

      <DndContext sensors={sensores} collisionDetection={closestCenter} onDragEnd={aoSoltarItemArrastado}>
        <SortableContext items={chavesParaSortable} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {itens.map((item, indice) => (
              <ItemImagemArrastavel
                key={item.chave}
                item={item}
                indice={indice}
                onRemover={() => removerItem(item.chave)}
              />
            ))}

            {podeAdicionarMais && (
              <BotaoAdicionarImagem onArquivosSelecionados={adicionarNovasImagens} />
            )}
          </div>
        </SortableContext>
      </DndContext>

      {erroQuantidade && (
        <p className="text-amber-600 text-xs font-semibold ml-1">{erroQuantidade}</p>
      )}
    </div>
  );
};

interface ItemImagemArrastavelProps {
  item: ItemDeImagem;
  indice: number;
  onRemover: () => void;
}

const ItemImagemArrastavel: React.FC<ItemImagemArrastavelProps> = ({ item, indice, onRemover }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.chave,
  });

  const estiloArrastavel: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const ehCapa = indice === 0;

  return (
    <div
      ref={setNodeRef}
      style={estiloArrastavel}
      className="relative aspect-square rounded-[20px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50"
    >
      <img src={item.url} alt={`Foto ${indice + 1}`} className="w-full h-full object-cover" />

      {ehCapa && (
        <span className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-amber-500 text-white text-[10px] font-bold rounded-full shadow">
          <Star size={10} />
          CAPA
        </span>
      )}

      <button
        type="button"
        onClick={onRemover}
        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow transition-all hover:scale-110"
        aria-label={`Remover imagem ${indice + 1}`}
      >
        <X size={12} />
      </button>

      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute bottom-2 right-2 p-1.5 bg-slate-900/70 text-white rounded-full hover:bg-slate-900 cursor-grab active:cursor-grabbing"
        aria-label={`Reordenar imagem ${indice + 1}`}
      >
        <GripVertical size={12} />
      </button>
    </div>
  );
};

interface BotaoAdicionarImagemProps {
  onArquivosSelecionados: (arquivos: FileList | null) => void;
}

const BotaoAdicionarImagem: React.FC<BotaoAdicionarImagemProps> = ({ onArquivosSelecionados }) => (
  <label className="cursor-pointer aspect-square rounded-[20px] border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex flex-col items-center justify-center bg-white group">
    <PlusCircle className="text-slate-400 group-hover:text-blue-600 mb-1 transition-colors" size={24} />
    <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-500 uppercase transition-colors">
      Adicionar
    </span>
    <input
      type="file"
      multiple
      accept="image/*"
      className="hidden"
      onChange={(evento) => {
        onArquivosSelecionados(evento.target.files);
        evento.target.value = "";
      }}
    />
  </label>
);

const mapearExistentesParaItens = (imagensExistentes: ImagemAnuncio[]): ItemDeImagem[] =>
  [...imagensExistentes]
    .sort((a, b) => a.ordemExibicao - b.ordemExibicao)
    .map((imagem) => ({
      chave: imagem.id,
      url: imagem.urlImagem,
      idExistente: imagem.id,
      arquivoNovo: null,
    }));

const criarItemDeNovaImagem = (arquivo: File, posicaoUnica: number): ItemDeImagem => ({
  chave: `${PREFIXO_NOVA_IMAGEM}${posicaoUnica}-${arquivo.name}-${arquivo.lastModified}`,
  url: URL.createObjectURL(arquivo),
  idExistente: null,
  arquivoNovo: arquivo,
});

const construirSelecao = (itens: ItemDeImagem[]): SelecaoDeImagens => {
  const idsParaManter: string[] = [];
  const novasImagens: File[] = [];

  for (const item of itens) {
    if (item.idExistente !== null) {
      idsParaManter.push(item.idExistente);
    } else if (item.arquivoNovo !== null) {
      novasImagens.push(item.arquivoNovo);
    }
  }

  return { idsParaManter, novasImagens, totalFinal: itens.length };
};

const calcularErroDeQuantidade = (total: number): string | null => {
  if (total < QUANTIDADE_MINIMA_IMAGENS) {
    return `O anuncio precisa de pelo menos ${QUANTIDADE_MINIMA_IMAGENS} imagens.`;
  }
  if (total > QUANTIDADE_MAXIMA_IMAGENS) {
    return `Limite de ${QUANTIDADE_MAXIMA_IMAGENS} imagens excedido.`;
  }
  return null;
};
