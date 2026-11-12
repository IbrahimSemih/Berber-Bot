"use client";
// Panelde oturumdaki dükkan. AdminLayout bir kez yükler, sayfalar useShop() ile
// okur; her sayfanın ayrıca "dükkanım hangisi?" sorgusu yapmasına gerek kalmaz.
// Yetki yine RLS'te: bu yalnızca hangi shop_id ile sorgulanacağını söyler.
import { createContext, useContext } from "react";

export type PanelShop = { id: string; name: string; slug: string | null };

export const ShopContext = createContext<PanelShop | null>(null);

/** Dükkan yüklenene kadar null döner. */
export function useShop(): PanelShop | null {
  return useContext(ShopContext);
}
