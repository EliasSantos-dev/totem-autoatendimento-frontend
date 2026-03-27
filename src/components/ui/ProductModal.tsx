import React, { useState } from "react";
import { PopCard } from "@/components/ui/PopCard";
import { PopButton } from "@/components/ui/PopButton";
import { X, Plus, Minus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface Addon {
  id: string;
  name: string;
  price: number;
  category: string;
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

export function ProductModal({
  isOpen,
  onClose,
  product,
  addons,
  onAddToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<
    { addon: Addon; quantity: number }[]
  >([]);

  // Reset state when modal opens with a new product
  React.useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedAddons([]);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const groupedAddons = addons.reduce((acc, addon) => {
    if (!acc[addon.category]) acc[addon.category] = [];
    acc[addon.category].push(addon);
    return acc;
  }, {} as Record<string, Addon[]>);

  const handleAddonChange = (addon: Addon, delta: number) => {
    setSelectedAddons((prev) => {
      const existing = prev.find((a) => a.addon.id === addon.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter((a) => a.addon.id !== addon.id);
        }
        return prev.map((a) =>
          a.addon.id === addon.id ? { ...a, quantity: newQuantity } : a
        );
      } else if (delta > 0) {
        return [...prev, { addon, quantity: 1 }];
      }
      return prev;
    });
  };

  const addonsTotal = selectedAddons.reduce(
    (acc, curr) => acc + curr.addon.price * curr.quantity,
    0
  );

  const totalPrice = (product.price + addonsTotal) * quantity;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, y: 50 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 50 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="bg-popWhite w-full max-w-3xl rounded-[2.5rem] border-[6px] border-popBlack shadow-[15px_15px_0px_#000] flex flex-col max-h-[90vh] overflow-hidden relative"
        >
          {/* Header */}
          <div className="bg-popYellow p-6 border-b-[6px] border-popBlack flex justify-between items-center z-10 relative">
            <h2 className="font-bangers text-[2.5rem] text-popBlack leading-none tracking-wide drop-shadow-sm uppercase">
              {product.name}
            </h2>
            <button
              onClick={onClose}
              className="p-3 bg-popRed rounded-full border-[4px] border-popBlack text-popWhite hover:bg-red-600 transition-colors transform hover:-translate-y-1 hover:shadow-[4px_4px_0px_#000] active:translate-y-0 active:shadow-none"
            >
              <X size={32} strokeWidth={4} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 flex flex-col gap-8 bg-[url('/cartoon-bg.png')] bg-cover bg-center rounded-b-[2rem] bg-blend-soft-light bg-opacity-50">
            {/* Product Image */}
            {product.image_url && (
              <div className="w-full aspect-square rounded-[2rem] border-4 border-popBlack overflow-hidden shadow-[6px_6px_0px_#000] bg-white">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Product description & Base price */}
            <div className="bg-white p-6 rounded-3xl border-4 border-popBlack shadow-[6px_6px_0px_#000]">
              <p className="font-nunito text-xl font-bold text-gray-700 mb-4">
                {product.desc}
              </p>
              <div className="flex justify-between items-end">
                <span className="font-bangers text-2xl text-gray-400 tracking-wider">
                  PREÇO BASE:
                </span>
                <span className="font-bangers text-4xl text-popRed">
                  R$ {product.price.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Addons Section */}
            {Object.keys(groupedAddons).length > 0 && (
              <div className="flex flex-col gap-6">
                <h3 className="font-bangers text-4xl text-popBlack stroke-white drop-shadow-md">
                  Turbine seu Pedido! 🚀
                </h3>

                {Object.entries(groupedAddons).map(([category, catAddons]) => (
                  <PopCard
                    key={category}
                    variant="white"
                    className="p-5 flex flex-col gap-4 border-[4px]"
                  >
                    <h4 className="font-bangers text-2xl text-popBlack uppercase border-b-4 border-popBlack pb-2 inline-block">
                      {category}
                    </h4>
                    <div className="flex flex-col gap-3">
                      {catAddons.map((addon) => {
                        const selected = selectedAddons.find(
                          (a) => a.addon.id === addon.id
                        );
                        const qty = selected ? selected.quantity : 0;
                        return (
                          <div
                            key={addon.id}
                            className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex flex-col">
                              <span className="font-bangers text-2xl tracking-wide text-popBlack">
                                {addon.name}
                              </span>
                              <span className="font-nunito font-bold text-popRed text-lg">
                                + R$ {addon.price.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 bg-popYellow px-2 py-1 rounded-2xl border-2 border-popBlack shadow-[2px_2px_0px_#000]">
                              <button
                                onClick={() => handleAddonChange(addon, -1)}
                                disabled={qty === 0}
                                className="p-2 bg-white rounded-xl border-2 border-popBlack active:bg-gray-200 disabled:opacity-50 transition-colors"
                              >
                                <Minus size={20} className="text-popBlack" />
                              </button>
                              <span className="font-bangers text-2xl w-6 text-center text-popBlack">
                                {qty}
                              </span>
                              <button
                                onClick={() => handleAddonChange(addon, 1)}
                                className="p-2 bg-white rounded-xl border-2 border-popBlack active:bg-gray-200 transition-colors"
                              >
                                <Plus size={20} className="text-popBlack" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </PopCard>
                ))}
              </div>
            )}
          </div>

          {/* Footer / Add to Cart */}
          <div className="bg-popBlack p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 z-10 rounded-b-[2rem]">
            {/* Quantity Selector for main product */}
            <div className="flex items-center gap-6 bg-white p-2 rounded-[2rem] border-4 border-popYellow self-start md:self-auto">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-4 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors"
              >
                <Minus size={24} className="text-popBlack" />
              </button>
              <span className="font-bangers text-4xl w-8 text-center text-popBlack">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="p-4 bg-popYellow rounded-2xl hover:bg-yellow-400 transition-colors"
              >
                <Plus size={24} className="text-popBlack" />
              </button>
            </div>

            <PopButton
              variant="primary"
              className="text-3xl px-8 py-5 flex items-center gap-4 w-full md:w-auto justify-center"
              onClick={() => {
                onAddToCart(product, quantity, selectedAddons);
                onClose();
              }}
            >
              <span className="uppercase text-popBlack">Adicionar</span>
              <span className="bg-white text-popRed px-4 py-1 rounded-full text-2xl border-2 border-popBlack shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                R$ {totalPrice.toFixed(2)}
              </span>
            </PopButton>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
