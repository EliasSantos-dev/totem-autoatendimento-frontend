"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MoveRight as ArrowRight, Zap, Star } from "lucide-react";
import { PopButton } from "@/components/ui/PopButton";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";

// Loop de Atração
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
      className="relative flex flex-col items-center justify-between min-h-screen bg-popYellow overflow-hidden cursor-pointer selection:bg-transparent pb-32 pt-16"
      onClick={handleStart}
    >
      {/* HALFTONE TEXTURE - MUITO SUAVE */}
      <div className="absolute inset-0 bg-halftone opacity-5 z-0 pointer-events-none"></div>

      {/* LANGUAGE SELECTOR - MAIOR E MAIS ACESSÍVEL */}
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

      {/* BACKGROUND ELEMENTS - Discretos */}
      <motion.div
        animate={{ y: [0, -30, 0], rotate: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity }}
        className="absolute top-[20%] left-[5%] text-popRed opacity-20 z-10"
      >
        <Star size={150} fill="currentColor" strokeWidth={6} className="drop-shadow-[8px_8px_0_#000]" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity }}
        className="absolute top-[60%] right-[5%] text-orange-500 opacity-20 z-10"
      >
        <Zap size={140} fill="currentColor" strokeWidth={6} className="drop-shadow-[8px_8px_0_#000]" />
      </motion.div>

      {/* HEADER: LOGO */}
      <div className="z-20 flex flex-col items-center justify-center w-full max-w-4xl px-8 mt-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 20 }}
          className="relative mb-8 z-30"
        >
          <motion.img
            src="/official-logo.png"
            alt="90s Burgers Logo"
            className="w-[42rem] h-auto object-contain drop-shadow-[25px_25px_0px_rgba(0,0,0,0.15)]"
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        {/* JANELAS DE PREVIEW (CARROSSEL GIGANTE PARA TOTEM) */}
        <div className="flex gap-6 mt-10 items-center justify-center relative">
          {attractImages.map((img, idx) => {
            const isCenter = idx === currentImage;
            if (!isCenter && idx !== (currentImage + 1) % attractImages.length && idx !== (currentImage + attractImages.length - 1) % attractImages.length) return null;
            
            return (
              <motion.div
                key={img}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: isCenter ? 1 : 0.6, scale: isCenter ? 1.1 : 0.9 }}
                transition={{ duration: 0.5 }}
                className={`w-64 h-64 border-[6px] border-popBlack rounded-[2rem] overflow-hidden shadow-[10px_10px_0_0_rgba(0,0,0,0.2)] bg-white p-2`}
              >
                <img
                  src={img}
                  alt={`Atração ${idx}`}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* FOOTER CTA (GIGANTE, PRONTO PARA DEDOS GRANDES) */}
      <motion.div
        className="w-full flex flex-col items-center z-30 mt-auto"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="cursor-pointer"
        >
          <PopButton
            variant="primary"
            className="px-32 py-16 rounded-[4rem] border-[8px] shadow-[20px_20px_0_0_#000] flex items-center gap-12 bg-popRed active:translate-x-4 active:translate-y-4 active:shadow-none transition-all group"
            onClick={(e) => {
              e.stopPropagation();
              handleStart();
            }}
          >
            <span className="font-bangers text-popYellow tracking-[.2em] uppercase text-[4.5rem] text-pop-stroke">
              {t.home.cta}
            </span>
            <div className="bg-popYellow p-6 rounded-full border-[6px] border-popBlack flex items-center justify-center group-hover:rotate-12 transition-transform">
              <ArrowRight size={70} strokeWidth={6} className="text-popRed" />
            </div>
          </PopButton>
        </motion.div>
        
        <p className="font-bangers text-[3rem] text-popBlack/30 tracking-[.2em] uppercase mt-12 pointer-events-none">
          {t.home.radical}
        </p>
      </motion.div>
    </main>
  );
}
