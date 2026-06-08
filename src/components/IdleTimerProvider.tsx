"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { PopButton } from "./ui/PopButton";

// 2 minutos de inatividade para disparar o aviso (telas de navegação/pedido)
const IDLE_TIMEOUT_MS = 120000;
// Na tela de pagamento o cliente fica parado olhando o celular para pagar o
// PIX — 2 min é curto e cancelaria pagamentos em andamento. Damos 5 minutos.
const PAYMENT_IDLE_TIMEOUT_MS = 300000;
// 10 segundos para responder ao aviso antes de resetar o Totem
const COUNTDOWN_MS = 10000;

export function IdleTimerProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(COUNTDOWN_MS / 1000);

  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetTotem = useCallback(() => {
    sessionStorage.clear();
    setShowWarning(false);
    router.push("/");
  }, [router]);

  const startCountdown = useCallback(() => {
    setShowWarning(true);
    setTimeLeft(COUNTDOWN_MS / 1000);

    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    countdownTimerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          resetTotem();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [resetTotem]);

  const resetIdleTimer = useCallback(() => {
    if (showWarning) {
      // Se clicou na tela durante o aviso, cancela o reset
      setShowWarning(false);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    // Não ativa o timer na tela inicial nem na tela de sucesso
    if (pathname === "/" || pathname === "/sucesso") return;

    // Na tela de pagamento usamos um timeout maior para não cancelar um PIX
    // que ainda está sendo pago.
    const timeout =
      pathname === "/pagamento" ? PAYMENT_IDLE_TIMEOUT_MS : IDLE_TIMEOUT_MS;

    idleTimerRef.current = setTimeout(() => {
      startCountdown();
    }, timeout);
  }, [pathname, showWarning, startCountdown]);

  useEffect(() => {
    resetIdleTimer();

    const events = [
      "mousedown",
      "mousemove",
      "keydown",
      "scroll",
      "touchstart",
    ];
    const handler = () => resetIdleTimer();

    events.forEach((e) => document.addEventListener(e, handler));

    return () => {
      events.forEach((e) => document.removeEventListener(e, handler));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [resetIdleTimer]);

  return (
    <>
      {children}

      <AnimatePresence>
        {showWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50, opacity: 0 }}
              className="bg-popYellow border-[6px] border-popBlack p-10 rounded-[3rem] shadow-[20px_20px_0_0_#000] max-w-2xl w-full text-center flex flex-col items-center gap-8"
            >
              <h2 className="font-bangers text-[5rem] leading-none text-popRed text-pop-stroke">
                AINDA ESTÁ AÍ?
              </h2>
              <p className="font-nunito text-2xl font-bold text-popBlack">
                Seu pedido será cancelado em{" "}
                <span className="text-4xl text-popRed">{timeLeft}</span>{" "}
                segundos por inatividade.
              </p>

              <PopButton
                variant="primary"
                className="text-4xl py-6 px-16 w-full animate-pulse"
                onClick={resetIdleTimer}
              >
                SIM, CONTINUAR PEDIDO!
              </PopButton>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
