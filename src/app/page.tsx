"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight as ArrowRight } from "lucide-react";
import { PopButton } from "@/components/ui/PopButton";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";
import { useCatalog } from "@/lib/catalog/useCatalog";

interface Featured {
  id: string;
  name: string;
  price: number;
  image_url: string;
  categoria: string;
}

const brl = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const formatBRL = (price: number) => `R$ ${brl.format(price)}`;

/** Prioriza categorias que rendem boas fotos de vitrine (burgers/combos). */
function featuredScore(categoria: string): number {
  const c = categoria.toLowerCase();
  if (c.includes("burger") || c.includes("smash") || c.includes("saiyajin"))
    return 3;
  if (c.includes("combo") || c.includes("oferta") || c.includes("promo"))
    return 2;
  if (c.includes("batata") || c.includes("entrada")) return 1;
  return 0;
}

export default function IdleScreen() {
  const router = useRouter();
  const { t, setLanguage, language } = useI18n();

  const [index, setIndex] = useState(0);

  // Usa o mesmo cache do cardápio (react-query): isso PRÉ-CARREGA o catálogo já
  // na tela de atração, então entrar no /cardapio fica instantâneo ("zero fila").
  const { data: rawCatalog } = useCatalog();

  // Destaques: produtos com foto e preço (prioriza burgers/combos).
  const featured = useMemo<Featured[]>(() => {
    if (!rawCatalog) return [];
    return rawCatalog
      .filter((i) => i.tipo === "PRATO" && i.store_item_enabled !== "N")
      .map((i) => ({
        id: String(i.codigo_saipos),
        name: String(i.item),
        price: Number(i.price),
        image_url: i.image_url ? String(i.image_url) : "",
        categoria: String(i.categoria || ""),
      }))
      .filter((p) => p.image_url && p.price > 0)
      .sort((a, b) => featuredScore(b.categoria) - featuredScore(a.categoria))
      .slice(0, 6);
  }, [rawCatalog]);

  // Auto-giro do carrossel.
  useEffect(() => {
    if (featured.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % featured.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featured.length]);

  const handleStart = () => router.push("/cardapio");

  const n = featured.length;
  // Cards visíveis: lateral esquerda, centro (destaque) e lateral direita.
  const visible =
    n === 0
      ? []
      : n === 1
        ? [{ item: featured[0], role: "center" as const }]
        : n === 2
          ? [
              { item: featured[index], role: "center" as const },
              { item: featured[(index + 1) % n], role: "right" as const },
            ]
          : [
              { item: featured[(index - 1 + n) % n], role: "left" as const },
              { item: featured[index], role: "center" as const },
              { item: featured[(index + 1) % n], role: "right" as const },
            ];

  return (
    <main
      className="relative flex flex-col items-center justify-between min-h-screen bg-popYellow overflow-hidden cursor-pointer selection:bg-transparent pb-24 pt-12"
      onClick={handleStart}
    >
      {/* Textura halftone bem suave */}
      <div className="absolute inset-0 bg-halftone opacity-5 z-0 pointer-events-none" />

      {/* Seletor de idioma */}
      <div className="absolute top-10 right-10 z-50 flex gap-6">
        {[
          { code: "pt", flag: "🇧🇷" },
          { code: "en", flag: "🇺🇸" },
          { code: "es", flag: "🇪🇸" },
        ].map((lang) => (
          <PopButton
            key={lang.code}
            variant={language === lang.code ? "primary" : "neutral"}
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl p-0 border-[6px]"
            onClick={(e) => {
              e.stopPropagation();
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              setLanguage(lang.code as any);
            }}
          >
            {lang.flag}
          </PopButton>
        ))}
      </div>

      {/* LOGO */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="z-20 flex flex-col items-center mt-8"
      >
        <motion.img
          src="/official-logo.png"
          alt="90's Burgers Logo"
          className="w-[30rem] h-auto object-contain drop-shadow-[18px_18px_0px_rgba(0,0,0,0.15)]"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* CARROSSEL DE DESTAQUES */}
      <div className="z-20 flex flex-col items-center gap-8 w-full px-8">
        <div className="flex items-center justify-center gap-8 h-[26rem] w-full">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.length === 0
              ? // Placeholder enquanto carrega (mantém o layout estável)
                [0, 1, 2].map((i) => (
                  <motion.div
                    key={`skeleton-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: i === 1 ? 0.4 : 0.2 }}
                    className={`${
                      i === 1 ? "w-72 h-80" : "w-52 h-64"
                    } bg-popWhite/60 border-[6px] border-popBlack rounded-[2rem] shadow-[10px_10px_0_0_rgba(0,0,0,0.15)]`}
                  />
                ))
              : visible.map(({ item, role }) => {
                  const isCenter = role === "center";
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{
                        opacity: isCenter ? 1 : 0.55,
                        scale: isCenter ? 1 : 0.82,
                      }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      transition={{ type: "spring", stiffness: 260, damping: 26 }}
                      className={`relative shrink-0 bg-popWhite border-[6px] border-popBlack rounded-[2rem] overflow-hidden ${
                        isCenter
                          ? "w-72 shadow-[12px_12px_0_0_#000] z-10"
                          : "w-52 shadow-[8px_8px_0_0_rgba(0,0,0,0.4)]"
                      }`}
                    >
                      {isCenter && (
                        <div className="absolute top-3 left-3 z-20 bg-popRed text-popYellow font-bangers text-xl tracking-wider px-4 py-1 rounded-full border-[3px] border-popBlack shadow-[3px_3px_0_0_#000] -rotate-6">
                          {t.home.featured}
                        </div>
                      )}
                      <div
                        className={`w-full ${
                          isCenter ? "h-64" : "h-48"
                        } bg-white overflow-hidden border-b-[5px] border-popBlack flex items-center justify-center`}
                      >
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const el = e.target as HTMLImageElement;
                            el.style.display = "none";
                            (el.parentElement as HTMLElement).innerHTML =
                              '<span class="text-7xl">🍔</span>';
                          }}
                        />
                      </div>
                      <div className="p-4 flex flex-col items-center text-center gap-1">
                        <h3
                          className={`font-bangers tracking-wide text-popBlack leading-none line-clamp-1 ${
                            isCenter ? "text-3xl" : "text-xl"
                          }`}
                        >
                          {item.name}
                        </h3>
                        <span
                          className={`font-bangers text-popRed drop-shadow-[2px_2px_0_#000] ${
                            isCenter ? "text-4xl" : "text-2xl"
                          }`}
                        >
                          {formatBRL(item.price)}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
          </AnimatePresence>
        </div>

        {/* Dots */}
        {n > 1 && (
          <div className="flex items-center gap-3">
            {featured.map((item, i) => (
              <div
                key={item.id}
                className={`rounded-full border-[3px] border-popBlack transition-all duration-300 ${
                  i === index
                    ? "w-10 h-4 bg-popRed"
                    : "w-4 h-4 bg-popWhite/70"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* CTA + tagline */}
      <motion.div
        className="w-full flex flex-col items-center z-30"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <PopButton
            variant="primary"
            className="px-28 py-12 rounded-[3.5rem] border-[8px] shadow-[18px_18px_0_0_#000] flex items-center gap-10 bg-popRed active:translate-x-3 active:translate-y-3 active:shadow-none transition-all group"
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
          >
            <span className="font-bangers text-popYellow tracking-[.2em] uppercase text-[3.5rem] text-pop-stroke">
              {t.home.cta}
            </span>
            <div className="bg-popYellow p-5 rounded-full border-[6px] border-popBlack flex items-center justify-center group-hover:rotate-12 transition-transform">
              <ArrowRight size={56} strokeWidth={6} className="text-popRed" />
            </div>
          </PopButton>
        </motion.div>
      </motion.div>
    </main>
  );
}
