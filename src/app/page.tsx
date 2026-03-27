"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight as ArrowRight, Zap, Star } from "lucide-react";
import { PopButton } from "@/components/ui/PopButton";
import { motion, AnimatePresence } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";

// Loop de Atração integrado em "janelas de quadrinhos"
const attractImages = [
  "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1623341214825-9f4f963727da?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600271886742-f049cd451bba?q=80&w=600&auto=format&fit=crop",
];

export default function IdleScreen() {
  const router = useRouter();
  const { t, setLanguage, language } = useI18n();
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % attractImages.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = () => {
    router.push("/cardapio");
  };

  return (
    <main
      className="relative flex flex-col items-center justify-center min-h-screen bg-popYellow overflow-hidden cursor-pointer selection:bg-transparent"
      onClick={handleStart}
    >
      {/* BACKGROUND RADICAL */}
      <div
        className="absolute inset-0 z-0 opacity-20 bg-cover bg-center mix-blend-overlay pointer-events-none"
        style={{ backgroundImage: "url('/cartoon-bg.png')" }}
      ></div>

      {/* HALFTONE TEXTURE */}
      <div className="absolute inset-0 bg-halftone opacity-10 z-0 pointer-events-none"></div>

      {/* LANGUAGE SELECTOR */}
      <div className="absolute top-8 right-8 z-50 flex gap-4">
        {[
          { code: "pt", flag: "🇧🇷" },
          { code: "en", flag: "🇺🇸" },
          { code: "es", flag: "🇪🇸" },
        ].map((lang) => (
          <PopButton
            key={lang.code}
            variant={language === lang.code ? "primary" : "neutral"}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl p-0 border-[4px] shadow-[4px_4px_0_0_#000]"
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

      {/* ELEMENTOS DE APOIO DISCRETOS */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-[10%] left-[8%] text-popRed opacity-30 z-10"
      >
        <Star
          size={80}
          fill="currentColor"
          strokeWidth={4}
          className="drop-shadow-[4px_4px_0_#000]"
        />
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.05, 1], rotate: [0, -5, 0] }}
        transition={{ duration: 7, repeat: Infinity }}
        className="absolute bottom-[15%] right-[10%] text-popCyan opacity-30 z-10"
      >
        <Zap
          size={70}
          fill="currentColor"
          strokeWidth={4}
          className="drop-shadow-[4px_4px_0_#000]"
        />
      </motion.div>

      {/* CONTEÚDO PRINCIPAL (CLEANER) */}
      <div className="z-20 flex flex-col items-center justify-center w-full max-w-4xl px-8 h-full">
        {/* LOGO OFICIAL HERO */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative mb-16 z-30"
        >
          <motion.img
            src="/official-logo.png"
            alt="90s Burgers Logo"
            className="w-[36rem] h-auto object-contain drop-shadow-[20px_20px_0px_rgba(0,0,0,0.1)]"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* CTA "TOQUE PARA PEDIR" (FOCAL) */}
        <motion.div
          className="w-full flex flex-col items-center gap-16"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            <PopButton
              variant="neutral"
              className="text-4xl px-24 py-12 rounded-full border-[8px] shadow-[15px_15px_0_0_#000] flex items-center gap-8 bg-white active:translate-x-2 active:translate-y-2 active:shadow-none transition-all group"
              onClick={(e) => {
                e.stopPropagation();
                handleStart();
              }}
            >
              <span className="font-bangers text-popRed tracking-[.15em] uppercase text-[3.5rem]">
                {t.home.cta}
              </span>
              <div className="bg-popBlack p-4 rounded-full group-hover:scale-110 transition-transform">
                <ArrowRight size={56} strokeWidth={5} className="text-white" />
              </div>
            </PopButton>
          </motion.div>

          {/* JANELAS DE PREVIEW (LOOP) - CLEAN LIST */}
          <div className="flex gap-8 mt-2 items-center justify-center">
            {attractImages.slice(0, 3).map((img, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + idx * 0.1 }}
                className={`w-40 h-40 border-[5px] border-popBlack rounded-3xl overflow-hidden shadow-[8px_8px_0_0_rgba(0,0,0,0.15)] bg-white p-1 transform ${idx === 1 ? "rotate-2" : idx === 0 ? "-rotate-3" : "rotate-[4deg]"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img}
                  alt={`Atração ${idx}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* FOOTER TEXT */}
      <div className="absolute bottom-10 left-0 right-0 text-center pointer-events-none select-none">
        <p className="font-bangers text-[2.5rem] text-popBlack/20 tracking-[.2em] uppercase">
          {t.home.radical}
        </p>
      </div>
    </main>
  );
}
