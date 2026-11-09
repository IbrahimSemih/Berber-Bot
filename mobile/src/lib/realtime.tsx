// Dükkanın randevu ve bildirim değişikliklerini dinleyip ilgili sorguları yeniler.
// Uygulama açıkken tek bir kanal yeterli (kök yerleşimde, dükkan hazırken bağlanır).
// Not: tablonun supabase_realtime yayınında olması gerekir
// (migrations/2026-11-09_realtime_appointments.sql). Yoksa ekranlar yine de
// aşağı çekince ve uygulamaya dönünce yenilenir.
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./supabase";

export function RealtimeBridge({ shopId }: { shopId: string }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const invalidate = (prefix: string) => queryClient.invalidateQueries({ queryKey: [prefix, shopId] });
    const channel = supabase
      .channel(`shop-${shopId}-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments", filter: `shop_id=eq.${shopId}` }, () => {
        invalidate("appointments");
        invalidate("customers");
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `shop_id=eq.${shopId}` }, () => {
        invalidate("notifications");
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId, queryClient]);

  return null;
}
