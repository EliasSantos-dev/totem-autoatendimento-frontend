"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PopCard } from "@/components/ui/PopCard";
import { PopButton } from "@/components/ui/PopButton";
import {
  ArrowLeft,
  Trash2,
  QrCode,
  UserCircle,
  Plus,
  Minus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";
import { categoryIcon } from "@/lib/categoryIcon";

interface CartItemAddon {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartItem {
  cartItemId: string;
  id: string;
  name: string;
  category: string;
  qtd: number;
  price: number;
  addons?: CartItemAddon[];
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { t } = useI18n();

  const [items, setItems] = useState<CartItem[]>([]);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const savedCart = sessionStorage.getItem("totem_current_cart");
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      if (parsed.items && Array.isArray(parsed.items)) {
        setItems(parsed.items);
      }
    }
  }, []);

  const total = items.reduce((acc, item) => {
    const addonsTotal = item.addons ? item.addons.reduce((a: number, b: CartItemAddon) => a + b.price * b.quantity, 0) : 0;
    return acc + (item.price + addonsTotal) * item.qtd;
  }, 0);

  const updateQuantity = (cartItemId: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        // Fallback for older cart items without cartItemId
        const idToMatch = item.cartItemId || item.id;
        if (idToMatch === cartItemId) {
          const newQtd = Math.max(1, item.qtd + delta);
          return { ...item, qtd: newQtd };
        }
        return item;
      })
    );
  };

  const removeItem = (cartItemId: string) => {
    setItems((prev) => prev.filter((i) => (i.cartItemId || i.id) !== cartItemId));
  };

  const handlePayment = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      const backendUrl =
        process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

      const response = await fetch(`${backendUrl}/orders/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: name || "Cliente Totem",
          customerCpf: cpf || "00000000000",
          items: items.map((i) => ({
            saiposId: i.id, // codigo_saipos — integration_code na Saipos
            name: i.name || i.id, // nome real do produto
            quantity: i.qtd,
            price: i.price,
            choice_items: (i.addons || []).map((addon: CartItemAddon) => ({
              integration_code: addon.id,
              desc_item: addon.name,
              quantity: addon.quantity,
              unit_price: addon.price,
            })),
          })),
        }),
      });

      if (!response.ok) throw new Error("Erro ao gerar pedido");

      const data = await response.json();
      sessionStorage.setItem("totem_current_order", JSON.stringify(data));
      // Save clear cart after checkout
      sessionStorage.removeItem("totem_current_cart");
      router.push("/pagamento");
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="flex flex-col min-h-screen bg-popWhite items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-halftone opacity-[0.05] pointer-events-none z-0"></div>
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -15, 0] }}
          transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
          className="text-[8rem] drop-shadow-lg mb-4"
        >
          🛒
        </motion.div>
        <h1 className="font-bangers text-[5rem] text-popRed text-pop-stroke text-center z-10">
          Seu carrinho está vazio!
        </h1>
        <p className="font-nunito font-bold text-2xl text-gray-500 mt-2 z-10">
          Que tal adicionar algo gostoso?
        </p>
        <PopButton
          variant="primary"
          className="mt-10 text-3xl px-12 py-6 z-10 hover:-translate-y-2 transition-transform"
          onClick={() => router.push("/cardapio")}
        >
          {t.checkout.backToMenu}
        </PopButton>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-popWhite relative overflow-hidden flex-row">
      <div className="absolute inset-0 bg-halftone opacity-[0.05] pointer-events-none z-0"></div>

      {/* Left section: Cart Items */}
      <section className="w-1/2 flex flex-col h-screen border-r-[6px] border-popBlack overflow-hidden z-10 shadow-[10px_0_20px_rgba(0,0,0,0.1)] relative bg-[url('/cartoon-bg.png')] bg-cover bg-center bg-blend-soft-light bg-opacity-20 bg-white">
        <header className="p-8 pb-4 flex items-center gap-6 bg-white/80 backdrop-blur-sm border-b-4 border-popBlack">
          <button
            onClick={() => router.back()}
            className="p-4 bg-popWhite rounded-full border-[4px] border-popBlack hover:bg-popYellow transition-colors shadow-[4px_4px_0_0_#000] active:shadow-none active:translate-y-1 active:translate-x-1"
          >
            <ArrowLeft size={36} strokeWidth={3} />
          </button>
          <h1 className="font-bangers text-5xl text-popRed text-pop-stroke tracking-wider">
            {t.checkout.title}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
          <AnimatePresence>
            {items.map((item) => {
              const itemTotal = item.price + (item.addons?.reduce((a: number, b: CartItemAddon) => a + b.price * b.quantity, 0) || 0);
              const identifier = item.cartItemId || item.id;
              
              return (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9, x: -30 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  key={identifier}
                >
                  <PopCard
                    variant="white"
                    className="flex flex-col p-0 overflow-hidden"
                  >
                    <div className="flex items-center p-6">
                      {/* Icon */}
                      <div className="w-20 h-20 bg-popYellow rounded-[1.5rem] border-4 border-popBlack flex items-center justify-center text-4xl shadow-[4px_4px_0_0_#000] mr-6">
                        {categoryIcon(item.category)}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-bangers text-3xl mb-1 text-popBlack leading-none line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="font-bangers text-2xl text-popRed">
                          R$ {itemTotal.toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 bg-gray-100 p-2 rounded-2xl border-[3px] border-popBlack ml-4">
                        <button
                          onClick={() => updateQuantity(identifier, -1)}
                          className="p-3 bg-white rounded-xl border-2 border-popBlack active:bg-gray-200 transition-colors"
                        >
                          <Minus size={24} />
                        </button>
                        <span className="font-bangers text-3xl w-8 text-center">
                          {item.qtd}
                        </span>
                        <button
                          onClick={() => updateQuantity(identifier, 1)}
                          className="p-3 bg-popYellow rounded-xl border-2 border-popBlack active:bg-yellow-300 transition-colors"
                        >
                          <Plus size={24} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(identifier)}
                        className="p-4 ml-6 bg-red-100 text-popRed rounded-2xl border-[3px] border-popRed hover:bg-popRed hover:text-white transition-colors"
                      >
                        <Trash2 size={32} />
                      </button>
                    </div>

                    {/* Addons List */}
                    {item.addons && item.addons.length > 0 && (
                      <div className="bg-gray-50 border-t-4 border-popBlack p-4 px-6 flex flex-col gap-2">
                        <span className="font-bangers text-xl text-gray-500 uppercase tracking-wide">Adicionais:</span>
                        {item.addons.map((addon: CartItemAddon, idx: number) => (
                           <div key={idx} className="flex justify-between items-center text-lg font-nunito font-bold text-gray-700 bg-white p-2 px-4 rounded-xl border-2 border-dashed border-gray-300">
                              <span><span className="text-popRed">{addon.quantity}x</span> {addon.name}</span>
                              <span>+ R$ {(addon.price * addon.quantity).toFixed(2)}</span>
                           </div>
                        ))}
                      </div>
                    )}
                  </PopCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </section>

      {/* Right section: Customer & Payment */}
      <section className="w-1/2 flex flex-col h-screen p-10 bg-popYellow z-10 justify-between">
        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto mt-8">
          <div className="flex items-center gap-4 mb-4">
            <UserCircle size={48} className="text-popBlack" />
            <h2 className="font-bangers text-[3.5rem] leading-none text-popBlack">
              {t.checkout.identification} <br />
              <span className="text-2xl text-gray-700 font-nunito font-bold">
                {t.checkout.optional}
              </span>
            </h2>
          </div>

          <PopCard variant="white" className="w-full flex flex-col gap-6 p-8 relative overflow-hidden">
            {/* Pop art accent */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-popRed rounded-full mix-blend-multiply opacity-20 filter blur-xl"></div>
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-300 rounded-full mix-blend-multiply opacity-20 filter blur-xl"></div>

            <div className="relative z-10">
              <label className="font-bangers text-2xl tracking-wide uppercase text-popBlack">
                {t.checkout.nameLabel}
              </label>
              <input
                type="text"
                className="w-full mt-2 p-5 text-2xl font-nunito font-bold border-[4px] border-popBlack rounded-2xl bg-white focus:outline-none focus:bg-yellow-50 focus:-translate-y-1 transition-all shadow-[4px_4px_0_0_#000] focus:shadow-[8px_8px_0_0_#000]"
                placeholder={t.checkout.namePlaceholder}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="relative z-10">
              <label className="font-bangers text-2xl tracking-wide uppercase text-popBlack">
                {t.checkout.cpfLabel}
              </label>
              <input
                type="text"
                className="w-full mt-2 p-5 text-2xl font-nunito font-bold border-[4px] border-popBlack rounded-2xl bg-white focus:outline-none focus:bg-yellow-50 focus:-translate-y-1 transition-all shadow-[4px_4px_0_0_#000] focus:shadow-[8px_8px_0_0_#000]"
                placeholder={t.checkout.cpfPlaceholder}
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
              />
            </div>
          </PopCard>
        </div>

        <div className="flex flex-col gap-6 w-full max-w-lg mx-auto pb-8">
          <div className="bg-popBlack border-[6px] border-white p-6 rounded-[2rem] flex justify-between items-center shadow-[8px_8px_0px_#000] text-popWhite mt-8 relative transform -rotate-1 hover:rotate-0 transition-transform">
            <span className="font-bangers text-3xl tracking-widest uppercase text-gray-300">
              {t.checkout.totalToPay}
            </span>
            <span className="font-bangers text-5xl text-popYellow drop-shadow-[2px_2px_0_rgba(0,0,0,1)]">
              R$ {total.toFixed(2)}
            </span>
          </div>

          <PopButton
            variant="primary"
            fullWidth
            className="text-4xl h-28 mt-2 animate-in zoom-in duration-300 relative overflow-hidden group shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000]"
            disabled={items.length === 0 || isProcessing}
            onClick={handlePayment}
          >
            {isProcessing ? (
              <span className="animate-pulse">{t.checkout.generatingPix}</span>
            ) : (
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center justify-center gap-4 w-full h-full"
              >
                <div className="bg-white p-2 rounded-xl text-popRed border-[3px] border-popBlack transform rotate-6 group-hover:-rotate-6 transition-transform">
                  <QrCode size={40} strokeWidth={3} />
                </div>
                <span className="uppercase tracking-wide">{t.checkout.payWithPix}</span>
              </motion.div>
            )}
          </PopButton>
        </div>
      </section>
    </main>
  );
}
