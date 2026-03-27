"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PopCard } from "@/components/ui/PopCard";
import { PopButton } from "@/components/ui/PopButton";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/i18n";

interface OrderData {
  orderId?: string;
  ticketNumber?: string | number;
  pix?: {
    payload?: string;
  };
}

export default function PagamentoScreen() {
  const router = useRouter();
  const { t } = useI18n();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    const storedOrder = sessionStorage.getItem("totem_current_order");
    let currentOrderId: string | null = null;
    let failedFetches = 0;

    if (storedOrder) {
      const parsed = JSON.parse(storedOrder);
      setOrderData(parsed);
      currentOrderId = parsed.orderId;
    }

    if (!currentOrderId) return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/orders/${currentOrderId}`,
        );
        if (response.ok) {
          failedFetches = 0;
          setNetworkError(false);
          const order = await response.json();
          if (order && order.status === "PAID") {
            clearInterval(interval);
            // Atualiza sessão com o pedido atualizado (o backend possivelmente injetou o ticketNumber global do Saipos)
            sessionStorage.setItem(
              "totem_current_order",
              JSON.stringify(order),
            );
            router.push("/sucesso");
          }
        } else {
          failedFetches++;
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
        failedFetches++;
      }

      if (failedFetches >= 3) {
        setNetworkError(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const qrCodeUrl = orderData?.pix?.payload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(orderData.pix.payload)}`
    : null;

  return (
    <main className="flex flex-col min-h-screen bg-popWhite p-6 justify-center items-center relative overflow-hidden">
      <div className="absolute inset-0 bg-halftone opacity-20 pointer-events-none z-0"></div>

      <div className="z-10 flex flex-col items-center max-w-lg w-full">
        <motion.h1
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="font-bangers text-[4rem] leading-[1] text-popRed text-pop-stroke text-center mb-8 drop-shadow-md transform -rotate-2"
        >
          {t.payment.title}
        </motion.h1>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-full"
        >
          <PopCard
            variant="yellow"
            className="w-full flex flex-col items-center p-10 gap-6"
          >
            {orderData && orderData.ticketNumber && (
              <h2 className="font-bangers text-4xl text-popBlack text-center -mt-2">
                {t.payment.password}{" "}
                <span className="text-5xl text-popRed ml-2">
                  #{orderData.ticketNumber}
                </span>
              </h2>
            )}

            <div className="bg-white p-4 rounded-4xl border-[6px] border-popBlack shadow-[8px_8px_0_0_#000] w-72 h-72 flex items-center justify-center overflow-hidden relative">
              {networkError && (
                <div className="absolute inset-0 bg-white/90 z-20 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-4xl animate-bounce">📡</span>
                  <p className="font-bangers text-xl text-popRed mt-2">
                    {t.payment.instability}
                  </p>
                </div>
              )}

              {qrCodeUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={qrCodeUrl}
                  alt="QR Code PIX"
                  className="w-full h-full object-contain"
                />
              ) : (
                <p className="font-bangers text-gray-400 text-3xl animate-pulse text-center">
                  {t.payment.generatingQr.split("...")[0]}
                  <br />
                  ...
                </p>
              )}
            </div>

            <p className="font-nunito text-xl font-black text-center mt-2 text-popBlack whitespace-pre-line">
              {t.payment.instruction}
            </p>
          </PopCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-10 font-bangers text-2xl tracking-widest text-gray-500 animate-pulse text-center"
        >
          {t.payment.waitingStatus}
        </motion.div>

        <PopButton
          variant="neutral"
          className="mt-12 px-8 py-5 w-full text-2xl"
          onClick={() => {
            sessionStorage.removeItem("totem_current_order");
            sessionStorage.removeItem("totem_current_cart");
            router.push("/");
          }}
        >
          {t.payment.cancel}
        </PopButton>
      </div>
    </main>
  );
}
