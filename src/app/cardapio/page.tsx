"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PopCard } from "@/components/ui/PopCard";
import { PopButton } from "@/components/ui/PopButton";
import { ProductModal, Addon, Product } from "@/components/ui/ProductModal";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

// Mapeamento de categoria para ícone/emoji
const CATEGORY_ICONS: Record<string, string> = {
  Burgers: "🍔",
  Lanches: "🍔",
  Porções: "🍟",
  Sides: "🍟",
  Bebidas: "🥤",
  Drinks: "🥤",
  Doces: "🍦",
  Sweets: "🍦",
  Sobremesas: "🍦",
  Pizzas: "🍕",
  Pastas: "🍝",
  Saladas: "🥗",
};


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
            name: String(item.item),
            price: Number(item.price) || 0,
            category: String(item.categoria || "Adicionais"),
          }));

        const uniqueCategories = Array.from(
          new Set(mapped.map((p) => p.category)),
        );

        setProducts(mapped);
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
      <aside className="w-1/4 max-w-[280px] bg-popYellow border-r-[6px] border-popBlack flex flex-col items-center py-8 z-10 shadow-pop relative">
        <button
          onClick={() => router.push("/")}
          className="mb-12 p-4 bg-popWhite rounded-full border-4 border-popBlack shadow-[4px_4px_0_0_#000] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all active:bg-popRed active:text-white"
        >
          <ArrowLeft size={36} strokeWidth={4} />
        </button>

        <div className="flex flex-col gap-6 w-full px-4">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            const icon = CATEGORY_ICONS[cat] || "🍽️";
            return (
              <motion.button
                key={cat}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveCategory(cat)}
                className={`flex flex-col items-center justify-center py-6 px-2 rounded-3xl border-4 border-popBlack shadow-[4px_4px_0_0_#000] transition-colors ${
                  isActive
                    ? "bg-popRed text-white"
                    : "bg-popWhite text-popBlack hover:bg-gray-100"
                }`}
              >
                <span className="text-5xl mb-2 filter drop-shadow-md">
                  {icon}
                </span>
                <span className="font-bangers text-2xl tracking-wide">
                  {cat}
                </span>
              </motion.button>
            );
          })}
        </div>
      </aside>

      {/* Grid de Produtos */}
      <section className="flex-1 flex flex-col h-screen overflow-hidden pb-40 z-10">
        <div className="p-8 pb-4">
          <h1 className="font-bangers text-[4rem] text-popRed text-pop-stroke tracking-wider drop-shadow-md uppercase">
            {activeCategory || t.menu.categories.Burgers}
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto px-8 pb-8">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            key={activeCategory}
            className="grid grid-cols-1 xl:grid-cols-2 gap-8"
          >
            {filteredProducts.map((prod) => (
              <motion.div variants={itemVariants} key={prod.id}>
                <PopCard
                  variant="white"
                  className="flex flex-col overflow-hidden group h-full justify-between hover:-translate-y-2 hover:shadow-[12px_12px_0px_#000] transition-all duration-300"
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
                        {CATEGORY_ICONS[prod.category] || "🍽️"}
                      </span>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <h2 className="font-bangers text-3xl tracking-wide text-popBlack mb-2 line-clamp-1">
                      {prod.name}
                    </h2>
                    <p className="font-nunito text-base font-bold text-gray-500 leading-snug line-clamp-2 mb-4">
                      {prod.desc}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="font-bangers text-4xl text-popRed">
                        R$ {prod.price.toFixed(2)}
                      </span>
                      <PopButton
                        variant="secondary"
                        className="py-3 px-6 border-2 text-xl transform group-active:scale-95 transition-transform"
                        onClick={() => {
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
            className="fixed bottom-0 left-[25%] right-0 p-8 z-30 pointer-events-none"
          >
            <div className="bg-popBlack border-[6px] border-[#333] p-5 rounded-[2.5rem] shadow-[0_-10px_30px_rgba(0,0,0,0.5)] pointer-events-auto flex items-center justify-between overflow-hidden relative">
              <div className="absolute inset-0 bg-halftone opacity-20 pointer-events-none" />

              <div className="flex items-center gap-6 text-popWhite pl-4 z-10">
                <div className="relative bg-popRed p-4 rounded-2xl border-[3px] border-white transform -rotate-3">
                  <ShoppingBag size={48} color="white" strokeWidth={2.5} />
                  <motion.div
                    key={cartItemsCount}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-4 -right-4 bg-popYellow text-popBlack w-10 h-10 rounded-full border-[3px] border-popBlack flex items-center justify-center font-bangers text-2xl shadow-sm"
                  >
                    {cartItemsCount}
                  </motion.div>
                </div>
                <div className="flex flex-col">
                  <span className="font-bangers text-2xl text-gray-400 tracking-wider">
                    {t.menu.total}
                  </span>
                  <motion.span
                    key={cartTotal}
                    initial={{ scale: 1.2, color: "#fff" }}
                    animate={{ scale: 1, color: "#facc15" }}
                    className="font-bangers text-5xl text-popYellow drop-shadow-md"
                  >
                    R$ {cartTotal.toFixed(2)}
                  </motion.span>
                </div>
              </div>

              <PopButton
                variant="primary"
                className="text-4xl px-12 py-6 rounded-3xl h-full border-[5px] z-10"
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
