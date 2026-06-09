import React, { useMemo, useState } from "react";
import { X, Plus, Minus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Addon {
  id: string;
  name: string;
  price: number;
  category: string;
  /** min/max de escolhas do grupo (Saipos: min_choices / max_choices). */
  min?: number;
  max?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  desc: string;
  category: string;
  image_url?: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  addons: Addon[];
  onAddToCart: (
    product: Product,
    quantity: number,
    selectedAddons: { addon: Addon; quantity: number }[]
  ) => void;
}

interface Group {
  name: string;
  min: number;
  max: number;
  options: Addon[];
}

const brl = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatBRL = (v: number) => `R$ ${brl.format(v)}`;

export function ProductModal({
  isOpen,
  onClose,
  product,
  addons,
  onAddToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<
    { addon: Addon; quantity: number }[]
  >([]);

  // Reseta ao abrir um produto novo.
  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelected([]);
    }
  }, [isOpen, product]);

  // Só os adicionais deste produto. Na Saipos o complemento tem
  // codigo_saipos = "<codigoDoProduto>.<idDaOpcao>", então o prefixo antes do
  // ponto identifica o prato pai.
  const groups = useMemo<Group[]>(() => {
    if (!product) return [];
    const mine = addons.filter((a) => a.id.split(".")[0] === product.id);
    const map = new Map<string, Group>();
    for (const a of mine) {
      const key = a.category || "Adicionais";
      if (!map.has(key)) {
        map.set(key, { name: key, min: a.min ?? 0, max: a.max ?? 99, options: [] });
      }
      map.get(key)!.options.push(a);
    }
    // Obrigatórios primeiro (mantém ordem estável dentro de cada bloco).
    return [...map.values()].sort(
      (x, y) => (y.min >= 1 ? 1 : 0) - (x.min >= 1 ? 1 : 0)
    );
  }, [addons, product]);

  const qtyOf = (id: string) =>
    selected.find((s) => s.addon.id === id)?.quantity ?? 0;
  const groupCount = (g: Group) =>
    g.options.reduce((s, o) => s + qtyOf(o.id), 0);

  // Escolha única (grupos max=1): seleciona exatamente uma opção do grupo.
  const selectSingle = (g: Group, addon: Addon) => {
    setSelected((prev) => {
      const alreadyThis = prev.some((s) => s.addon.id === addon.id);
      const withoutGroup = prev.filter(
        (s) => !g.options.some((o) => o.id === s.addon.id)
      );
      // Opcional (min 0) permite desmarcar; obrigatório sempre mantém uma escolha.
      if (alreadyThis && g.min === 0) return withoutGroup;
      return [...withoutGroup, { addon, quantity: 1 }];
    });
  };

  // Steppers (grupos max>1): respeita o máximo do grupo.
  const step = (g: Group, addon: Addon, delta: number) => {
    setSelected((prev) => {
      const cur = prev.find((s) => s.addon.id === addon.id)?.quantity ?? 0;
      const total = g.options.reduce(
        (s, o) =>
          s + (prev.find((p) => p.addon.id === o.id)?.quantity ?? 0),
        0
      );
      if (delta > 0 && total >= g.max) return prev;
      const next = Math.max(0, cur + delta);
      if (next === 0) return prev.filter((s) => s.addon.id !== addon.id);
      if (prev.some((s) => s.addon.id === addon.id))
        return prev.map((s) =>
          s.addon.id === addon.id ? { ...s, quantity: next } : s
        );
      return [...prev, { addon, quantity: next }];
    });
  };

  const requiredGroups = groups.filter((g) => g.min >= 1);
  const missing = requiredGroups.filter((g) => groupCount(g) < g.min);
  const canAdd = missing.length === 0;

  const addonsTotal = selected.reduce(
    (acc, c) => acc + c.addon.price * c.quantity,
    0
  );
  const totalPrice = product ? (product.price + addonsTotal) * quantity : 0;

  return (
    <AnimatePresence>
      {isOpen && product && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
        >
          <div className="absolute inset-0 bg-halftone opacity-10 pointer-events-none" />

          <motion.div
            key="sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-5xl h-[92vh] bg-popWhite rounded-t-[2.5rem] border-t-[6px] border-x-[6px] border-popBlack shadow-[0_-12px_40px_rgba(0,0,0,0.45)] flex flex-col overflow-hidden"
          >
            {/* Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-2 bg-popBlack/25 rounded-full z-30" />

            {/* Header com foto + nome */}
            <div className="relative shrink-0 border-b-[6px] border-popBlack">
              {product.image_url ? (
                <div className="h-52 w-full overflow-hidden bg-white">
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <div className="h-32 w-full bg-popYellow" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
              <button
                onClick={onClose}
                className="absolute top-5 right-5 p-3 bg-popRed rounded-full border-[4px] border-popBlack text-popWhite shadow-[4px_4px_0px_#000] active:translate-y-1 active:shadow-none transition-all"
              >
                <X size={28} strokeWidth={4} />
              </button>
              <div className="absolute bottom-3 left-6 right-6">
                <h2 className="font-bangers text-[2.75rem] leading-none tracking-wide text-popWhite drop-shadow-[3px_3px_0_#000] uppercase line-clamp-2">
                  {product.name}
                </h2>
              </div>
            </div>

            {/* Corpo rolável */}
            <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
              {product.desc && (
                <p className="font-nunito text-xl font-bold text-gray-600 leading-snug">
                  {product.desc}
                </p>
              )}

              {groups.map((g) => {
                const required = g.min >= 1;
                const count = groupCount(g);
                const done = !required || count >= g.min;
                const isSingle = g.max === 1;
                return (
                  <section
                    key={g.name}
                    className={`rounded-3xl border-[4px] p-5 transition-colors ${
                      required && !done
                        ? "border-popRed bg-red-50"
                        : "border-popBlack bg-white"
                    }`}
                  >
                    {/* Header do grupo */}
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3 border-b-4 border-dashed border-popBlack/30">
                      <h3 className="font-bangers text-3xl tracking-wide text-popBlack uppercase leading-none">
                        {g.name}
                      </h3>
                      {required ? (
                        <span
                          className={`shrink-0 font-bangers text-base tracking-wider px-3 py-1 rounded-full border-[3px] border-popBlack ${
                            done
                              ? "bg-green-500 text-white"
                              : "bg-popRed text-popYellow"
                          }`}
                        >
                          {done ? "✓ OK" : "OBRIGATÓRIO"}
                        </span>
                      ) : (
                        <span className="shrink-0 font-bangers text-base tracking-wider px-3 py-1 rounded-full border-[3px] border-popBlack bg-popYellow text-popBlack">
                          OPCIONAL{g.max < 90 ? ` • ATÉ ${g.max}` : ""}
                        </span>
                      )}
                    </div>

                    {isSingle ? (
                      /* Cartões de seleção (escolha 1) */
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {g.options.map((opt) => {
                          const sel = qtyOf(opt.id) > 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => selectSingle(g, opt)}
                              className={`flex items-center justify-between gap-3 text-left p-4 rounded-2xl border-[4px] border-popBlack transition-all active:translate-y-1 ${
                                sel
                                  ? "bg-popRed text-popYellow shadow-[4px_4px_0_0_#000]"
                                  : "bg-popWhite text-popBlack shadow-[4px_4px_0_0_rgba(0,0,0,0.25)]"
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className={`shrink-0 w-8 h-8 rounded-full border-[3px] border-popBlack flex items-center justify-center ${
                                    sel ? "bg-popYellow" : "bg-white"
                                  }`}
                                >
                                  {sel && (
                                    <Check
                                      size={20}
                                      strokeWidth={5}
                                      className="text-popRed"
                                    />
                                  )}
                                </span>
                                <span className="font-bangers text-2xl tracking-wide leading-none line-clamp-2">
                                  {opt.name}
                                </span>
                              </div>
                              {opt.price > 0 && (
                                <span className="shrink-0 font-nunito font-black text-lg">
                                  +{formatBRL(opt.price)}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      /* Steppers (opcionais / múltiplos) */
                      <div className="flex flex-col gap-3">
                        {g.options.map((opt) => {
                          const qty = qtyOf(opt.id);
                          const atMax = count >= g.max;
                          return (
                            <div
                              key={opt.id}
                              className="flex items-center justify-between gap-3 p-2 rounded-2xl"
                            >
                              <div className="flex flex-col min-w-0">
                                <span className="font-bangers text-2xl tracking-wide text-popBlack leading-none line-clamp-1">
                                  {opt.name}
                                </span>
                                {opt.price > 0 && (
                                  <span className="font-nunito font-bold text-popRed text-lg">
                                    +{formatBRL(opt.price)}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 bg-popWhite px-3 py-2 rounded-2xl border-[4px] border-popBlack shadow-[3px_3px_0px_#000]">
                                <button
                                  onClick={() => step(g, opt, -1)}
                                  disabled={qty === 0}
                                  className="p-3 bg-popYellow rounded-xl border-[3px] border-popBlack active:translate-y-1 disabled:opacity-40 transition-all"
                                >
                                  <Minus size={26} strokeWidth={4} className="text-popBlack" />
                                </button>
                                <span className="font-bangers text-3xl w-7 text-center text-popBlack">
                                  {qty}
                                </span>
                                <button
                                  onClick={() => step(g, opt, 1)}
                                  disabled={atMax}
                                  className="p-3 bg-popYellow rounded-xl border-[3px] border-popBlack active:translate-y-1 disabled:opacity-40 transition-all"
                                >
                                  <Plus size={26} strokeWidth={4} className="text-popBlack" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}
            </div>

            {/* Rodapé fixo */}
            <div className="shrink-0 bg-popBlack border-t-[6px] border-popBlack p-5 flex items-center gap-5">
              {/* Quantidade */}
              <div className="flex items-center gap-4 bg-popWhite p-2 rounded-2xl border-[4px] border-popBlack shrink-0">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="p-3 bg-popRed rounded-xl border-[3px] border-popBlack active:translate-y-1 transition-all"
                >
                  <Minus size={28} strokeWidth={5} className="text-popYellow" />
                </button>
                <span className="font-bangers text-4xl w-9 text-center text-popBlack">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="p-3 bg-popRed rounded-xl border-[3px] border-popBlack active:translate-y-1 transition-all"
                >
                  <Plus size={28} strokeWidth={5} className="text-popYellow" />
                </button>
              </div>

              {/* Adicionar */}
              <button
                disabled={!canAdd}
                onClick={() => {
                  if (!canAdd) return;
                  onAddToCart(product, quantity, selected);
                  onClose();
                }}
                className={`flex-1 h-full min-h-[5rem] rounded-2xl border-[5px] border-popBlack font-bangers tracking-wider uppercase transition-all flex items-center justify-center gap-4 px-6 ${
                  canAdd
                    ? "bg-popRed text-popYellow shadow-[6px_6px_0_0_#000] active:translate-x-1 active:translate-y-1 active:shadow-none"
                    : "bg-gray-500 text-gray-300 cursor-not-allowed"
                }`}
              >
                {canAdd ? (
                  <>
                    <span className="text-3xl">Adicionar</span>
                    <span className="bg-popWhite text-popRed px-4 py-1 rounded-full text-2xl border-[3px] border-popBlack">
                      {formatBRL(totalPrice)}
                    </span>
                  </>
                ) : (
                  <span className="text-xl leading-tight">
                    Escolha: {missing.map((g) => g.name).join(", ")}
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
