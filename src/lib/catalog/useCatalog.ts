"use client";

import { useQuery } from "@tanstack/react-query";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export type RawCatalogItem = Record<string, unknown>;

async function fetchCatalog(): Promise<RawCatalogItem[]> {
  const res = await fetch(`${BACKEND_URL}/saipos/catalog`);
  if (!res.ok) throw new Error("Erro ao buscar catálogo");
  return res.json();
}

/**
 * Catálogo via react-query. Compartilha cache entre a tela inicial e o cardápio
 * (mesma queryKey), então a home pré-carrega e entrar no /cardapio é instantâneo
 * ("zero fila"). O staleTime (5 min) está configurado no QueryClient.
 */
export function useCatalog() {
  return useQuery({ queryKey: ["catalog"], queryFn: fetchCatalog });
}
