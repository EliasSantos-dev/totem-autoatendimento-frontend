"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, X, Loader2, AlertTriangle } from "lucide-react";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

interface HealthCheck {
  key: string;
  label: string;
  ok: boolean;
  critical: boolean;
  detail?: string;
}
interface HealthReport {
  ok: boolean;
  checks: HealthCheck[];
  checkedAt: string;
}

type Status = "loading" | "ok" | "down" | "unreachable";

/**
 * Porteiro do totem: só libera o app quando o backend reporta todos os serviços
 * CRÍTICOS no ar (Mongo, Saipos, AbacatePay). Enquanto não, mostra uma tela de
 * diagnóstico amigável (para o operador resolver) e re-tenta sozinho.
 */
export function HealthGate({ children }: { children: React.ReactNode }) {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: HealthReport = await res.json();
        if (!active) return;
        setReport(data);
        setStatus(data.ok ? "ok" : "down");
      } catch {
        if (!active) return;
        setReport(null);
        setStatus("unreachable");
      }
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (status === "ok") return <>{children}</>;

  return <DiagnosticScreen status={status} report={report} />;
}

function DiagnosticScreen({
  status,
  report,
}: {
  status: Status;
  report: HealthReport | null;
}) {
  const title =
    status === "loading"
      ? "INICIANDO O TOTEM..."
      : status === "unreachable"
        ? "CONECTANDO AO SISTEMA..."
        : "ESTAMOS QUASE LÁ!";

  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen bg-popYellow overflow-hidden p-8">
      <div className="absolute inset-0 bg-halftone opacity-5 pointer-events-none" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
        className="z-10 w-full max-w-2xl bg-popWhite border-[6px] border-popBlack rounded-[2.5rem] shadow-[12px_12px_0_0_#000] overflow-hidden"
      >
        {/* Header */}
        <div className="bg-popRed border-b-[6px] border-popBlack px-8 py-6 flex items-center gap-4">
          <Loader2 size={44} strokeWidth={3} className="text-popYellow animate-spin" />
          <h1 className="font-bangers text-[2.75rem] leading-none tracking-wide text-popYellow text-pop-stroke">
            {title}
          </h1>
        </div>

        <div className="p-8 flex flex-col gap-4">
          {status === "unreachable" ? (
            <div className="flex flex-col items-center text-center gap-4 py-6">
              <AlertTriangle size={72} strokeWidth={2.5} className="text-popRed" />
              <p className="font-nunito text-2xl font-bold text-popBlack">
                O servidor do totem não respondeu.
              </p>
              <p className="font-nunito text-lg text-gray-600">
                Verifique se o <b>backend</b> está rodando (PM2) e se o MongoDB
                está ativo. Tentando reconectar...
              </p>
            </div>
          ) : (
            <>
              <p className="font-nunito text-xl font-bold text-gray-600 text-center mb-2">
                Verificando os sistemas do totem antes de abrir:
              </p>
              {(report?.checks ?? []).map((c) => (
                <div
                  key={c.key}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-[4px] ${
                    c.ok
                      ? "border-green-600 bg-green-50"
                      : c.critical
                        ? "border-popRed bg-red-50"
                        : "border-yellow-500 bg-yellow-50"
                  }`}
                >
                  <span
                    className={`shrink-0 w-11 h-11 rounded-full border-[3px] border-popBlack flex items-center justify-center ${
                      c.ok ? "bg-green-500" : c.critical ? "bg-popRed" : "bg-yellow-400"
                    }`}
                  >
                    {c.ok ? (
                      <Check size={24} strokeWidth={4} className="text-white" />
                    ) : (
                      <X size={24} strokeWidth={4} className="text-white" />
                    )}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-bangers text-2xl tracking-wide text-popBlack leading-none">
                      {c.label}
                      {!c.critical && (
                        <span className="ml-2 font-nunito text-xs font-bold text-yellow-700 uppercase">
                          (opcional)
                        </span>
                      )}
                    </span>
                    {!c.ok && c.detail && (
                      <span className="font-nunito text-base font-bold text-gray-600">
                        {c.detail}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          <p className="font-nunito text-base text-gray-400 text-center mt-2 animate-pulse">
            Tentando novamente automaticamente...
          </p>
        </div>
      </motion.div>
    </main>
  );
}
