"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PopCard } from "@/components/ui/PopCard";
import { PopButton } from "@/components/ui/PopButton";
import { ProductModal, Addon, Product } from "@/components/ui/ProductModal";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";
import { categoryIcon } from "@/lib/categoryIcon";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";


/** Converte item do catálogo Saipos para o formato interno do frontend */
function mapSaiposItem(item: Record<string, unknown>): Product | null {
  // Só exibe PRATO habilitado
  if (item.tipo !== "PRATO") return null;
  if (item.store_item_enabled === "N") return null;

  return {
    id: String(item.codigo_saipos),
    name: String(item.item),
    price: Number(item.price),
    desc: String(
      item.tamanho && item.tamanho !== "Único" ? item.tamanho : item.categoria
    ),
    category: String(item.category || item.categoria),
    image_url: item.image_url ? String(item.image_url) : undefined,
  };
}

export default function CardapioScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const [products, setProducts] = useState<Product[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [cart, setCart] = useState<
    { cartItemId: string; id: string; name: string; category: string; qtd: number; price: number; addons: { id: string; name: string; price: number; quantity: number }[] }[]
  >([]);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/saipos/catalog`);
        if (!res.ok) throw new Error("Erro ao buscar catálogo");
        const data: Record<string, unknown>[] = await res.json();

        const mapped = data
          .map(mapSaiposItem)
          .filter((p): p is Product => p !== null);

        const addonsMapped = data
          .filter(
            (item) =>
              item.tipo === "COMPLEMENTO" && item.store_item_enabled === "Y"
          )
          .map((item) => ({
            id: String(item.codigo_saipos),
            // Na Saipos, para COMPLEMENTO: `item` = nome do PRODUTO pai,
            // `complemento` = grupo de escolha (ex.: "Transformar") e
            // `complemento_item` = a opção em si (ex.: "Bacon"). Antes usávamos
            // `item`, então toda opção saía com o nome do produto repetido.
            name: String(item.complemento_item || item.item),
            price: Number(item.price) || 0,
            category: String(item.complemento || item.categoria || "Adicionais"),
            min: Number(item.min_choices) || 0,
            max: Number(item.max_choices) || 99,
          }));

        // Esconde itens-lixo que a Saipos manda habilitados: preço R$ 0 E sem
        // nenhum grupo de adicional (ex.: o item/categoria "Diversos"). Combos
        // de preço 0 que se montam por escolhas (ex.: "Trio Gk") são mantidos
        // porque têm grupos de adicional.
        const addonProductIds = new Set(
          addonsMapped.map((a) => a.id.split(".")[0]),
        );
        const visibleProducts = mapped.filter(
          (p) => p.price > 0 || addonProductIds.has(p.id),
        );

        const uniqueCategories = Array.from(
          new Set(visibleProducts.map((p) => p.category)),
        );

        setProducts(visibleProducts);
        setAddons(addonsMapped);
        setCategories(uniqueCategories);
        setActiveCategory(uniqueCategories[0] || "");
      } catch (err) {
        console.error("Falha ao carregar catálogo Saipos:", err);
        // Fallback: categorias e produtos zerados — exibe mensagem de vazio
        setProducts([]);
        setAddons([]);
        setCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCatalog();
  }, []);

  const filteredProducts = useMemo(
    () => products.filter((p) => p.category === activeCategory),
    [products, activeCategory],
  );

  const cartTotal = cart.reduce((acc, item) => {
    const itemTotal = item.price + item.addons.reduce((a, b) => a + b.price * b.quantity, 0);
    return acc + itemTotal * item.qtd;
  }, 0);
  const cartItemsCount = cart.reduce((acc, item) => acc + item.qtd, 0);

  const handleAddToCart = (
    product: Product,
    quantity: number,
    selectedAddons: { addon: Addon; quantity: number }[]
  ) => {
    setCart((prev) => {
      // Create a unique hash for the product + addons combination
      const addonsHash = selectedAddons
        .map((a) => `${a.addon.id}:${a.quantity}`)
        .sort()
        .join("|");
      const cartItemId = `${product.id}-${addonsHash}`;

      const exists = prev.find((i) => i.cartItemId === cartItemId);
      if (exists) {
        return prev.map((i) =>
          i.cartItemId === cartItemId ? { ...i, qtd: i.qtd + quantity } : i
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          id: product.id,
          name: product.name,
          category: product.category,
          qtd: quantity,
          price: product.price,
          addons: selectedAddons.map((a) => ({
            id: a.addon.id,
            name: a.addon.name,
            price: a.addon.price,
            quantity: a.quantity,
          })),
        },
      ];
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring" as const, stiffness: 300, damping: 24 },
    },
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen bg-popWhite items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 border-[6px] border-popRed border-t-transparent rounded-full animate-spin" />
          <p className="font-bangers text-4xl text-popBlack tracking-widest">
            Carregando Cardápio...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-popWhite relative overflow-hidden flex-row">
      <div className="absolute inset-0 bg-halftone opacity-[0.05] pointer-events-none z-0" />

      {/* Sidebar de Categorias */}
      <aside className="w-[200px] shrink-0 bg-popYellow border-r-[6px] border-popBlack flex flex-col items-center pt-8 z-10 shadow-[8px_0px_0_0_#000] relative h-screen">
        <button
          onClick={() => router.push("/")}
          className="mb-6 shrink-0 p-4 bg-popWhite rounded-full border-[5px] border-popBlack shadow-[4px_4px_0_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] active:translate-y-1 active:shadow-none transition-all text-popBlack"
        >
          <ArrowLeft size={36} strokeWidth={4} />
        </button>

        <div className="flex flex-col gap-3 w-full px-3 pb-8 overflow-y-auto flex-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const icon = categoryIcon(cat);
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 h-28 w-full flex flex-col items-center justify-center gap-1 px-2 rounded-3xl border-[5px] border-popBlack shadow-[6px_6px_0_0_#000] active:translate-y-2 active:shadow-none transition-all ${
                  isActive
                    ? "bg-popRed text-popYellow"
                    : "bg-popWhite text-popBlack"
                }`}
              >
                <span className="text-5xl leading-none filter drop-shadow-[3px_3px_0_#000]">
                  {icon}
                </span>
                <span className="font-bangers text-lg leading-tight tracking-wide text-center line-clamp-2">
                  {cat}
                </span>
              </motion.button>
            );
          })}
        </div>
      </aside>

      {/* Grid de Produtos */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden pb-48 z-10">
        <div className="p-10 pb-6">
          <h1 className="font-bangers text-[5.5rem] text-popRed text-pop-stroke tracking-wider drop-shadow-[6px_6px_0_#000] uppercase inline-block bg-popYellow px-8 py-2 border-[6px] border-popBlack transform -rotate-2">
            {activeCategory || t.menu.categories.Burgers}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-10 pb-12">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={activeCategory}
            className="grid grid-cols-2 gap-10"
          >
            {filteredProducts.map((prod) => (
              <motion.div variants={itemVariants} key={prod.id}>
                <PopCard
                  variant="white"
                  onClick={() => {
                    setSelectedProduct(prod);
                    setIsModalOpen(true);
                  }}
                  className="flex flex-col overflow-hidden group h-full justify-between cursor-pointer hover:-translate-y-2 hover:shadow-[12px_12px_0px_#000] transition-all duration-300"
                >
                  {/* Imagem do Produto */}
                  <div className="w-full aspect-square border-b-4 border-popBlack overflow-hidden relative bg-white flex items-center justify-center">
                    {prod.image_url ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = ""; // Clear source on error to show placeholder
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    ) : (
                      <span className="text-8xl">
                        {categoryIcon(prod.category)}
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex-1 flex flex-col">
                    <h2 className="font-bangers text-4xl tracking-wide text-popBlack mb-3 line-clamp-1">
                      {prod.name}
                    </h2>
                    <p className="font-nunito text-xl font-bold text-gray-600 leading-snug line-clamp-2 mb-6">
                      {prod.desc}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-4 border-t-4 border-popBlack border-dashed">
                      <span className="font-bangers text-5xl text-popRed drop-shadow-[2px_2px_0_#000]">
                        R$ {prod.price.toFixed(2)}
                      </span>
                      <PopButton
                        variant="warning"
                        className="py-4 px-8 text-2xl transform transition-transform"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(prod);
                          setIsModalOpen(true);
                        }}
                      >
                        {t.menu.add}
                      </PopButton>
                    </div>
                  </div>
                </PopCard>
              </motion.div>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full py-20 flex flex-col items-center justify-center opacity-50">
                <span className="text-8xl mb-4">😢</span>
                <h3 className="font-bangers text-3xl">{t.menu.empty}</h3>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Barra do Carrinho */}
      <AnimatePresence>
        {cartItemsCount > 0 && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-0 left-[200px] right-0 p-10 z-30 pointer-events-none"
          >
            <div className="bg-popBlack border-[6px] border-[#333] p-6 rounded-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.6)] pointer-events-auto flex items-center justify-between overflow-hidden relative">
              <div className="absolute inset-0 bg-halftone opacity-20 pointer-events-none" />

              <div className="flex items-center gap-8 text-popWhite pl-6 z-10">
                <div className="relative bg-popRed p-5 rounded-[2rem] border-[4px] border-white transform -rotate-3 shadow-[6px_6px_0_0_#000]">
                  <ShoppingBag size={56} color="white" strokeWidth={3} />
                  <motion.div
                    key={cartItemsCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-6 -right-6 bg-popYellow text-popBlack w-14 h-14 rounded-full border-[5px] border-popBlack flex items-center justify-center font-bangers text-[2.5rem] shadow-[4px_4px_0_0_#000] transform rotate-6"
                  >
                    {cartItemsCount}
                  </motion.div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-bangers text-[2rem] text-gray-300 tracking-wider">
                    {t.menu.total}
                  </span>
                  <motion.span
                    key={cartTotal}
                    initial={{ scale: 1.2, color: "#fff" }}
                    animate={{ scale: 1, color: "#facc15" }}
                    className="font-bangers text-[4.5rem] text-popYellow drop-shadow-[4px_4px_0_#000] leading-none"
                  >
                    R$ {cartTotal.toFixed(2)}
                  </motion.span>
                </div>
              </div>

              <PopButton
                variant="primary"
                className="text-[3rem] px-16 py-8 rounded-[3rem] h-full border-[6px] z-10"
                onClick={() => {
                  sessionStorage.setItem(
                    "totem_current_cart",
                    JSON.stringify({ items: cart, total: cartTotal }),
                  );
                  router.push("/checkout");
                }}
              >
                {t.menu.myOrder} {"->"}
              </PopButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Produto */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        product={selectedProduct}
        addons={addons}
        onAddToCart={handleAddToCart}
      />
    </main>
  );
}
