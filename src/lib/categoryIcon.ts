/**
 * Emoji por categoria, casando por palavra-chave (as categorias reais da Saipos
 * são "Burgers Premium", "Bebidas de qualidade", "Linha Saiyajin (smash)", etc.,
 * então match exato não funciona). A ordem importa: regras mais específicas
 * primeiro (ex.: "combo" antes de "coca", "bebida" antes dos burgers).
 */
export function categoryIcon(category: string): string {
  const c = (category || "").toLowerCase();

  if (c.includes("cerveja")) return "🍺";
  if (c.includes("shake")) return "🥤"; // milk shake
  if (c.includes("combo")) return "🍔"; // combos (inclui "Combos com Coca Cola")
  if (
    c.includes("bebida") ||
    c.includes("refri") ||
    c.includes("coca") ||
    c.includes("drink") ||
    c.includes("suco") ||
    c.includes("água") ||
    c.includes("agua")
  )
    return "🥤";
  if (c.includes("sobremesa") || c.includes("doce") || c.includes("sweet"))
    return "🍰";
  if (c.includes("bombo") || c.includes("bala") || c.includes("chocolate"))
    return "🍬";
  if (
    c.includes("vegetarian") ||
    c.includes("veg") ||
    c.includes("salada") ||
    c.includes("salad")
  )
    return "🥗";
  if (c.includes("batata") || c.includes("fritas") || c.includes("fries"))
    return "🍟";
  if (
    c.includes("entrada") ||
    c.includes("petisc") ||
    c.includes("porç") ||
    c.includes("porc")
  )
    return "🍤";
  if (c.includes("promo") || c.includes("oferta") || c.includes("desconto"))
    return "🔥";
  if (
    c.includes("burger") ||
    c.includes("smash") ||
    c.includes("saiyajin") ||
    c.includes("dupl") ||
    c.includes("xtreme") ||
    c.includes("120g") ||
    c.includes("lanche") ||
    c.includes("fase") ||
    c.includes("gk")
  )
    return "🍔";

  return "🍔"; // fallback food-forward (antes era 🍽️)
}
