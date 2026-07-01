"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationListener({ shopId }: { shopId: string }) {
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (!shopId) return;

    const supabase = createClient();

    // Subscribe to new appointments for this shop
    const channel = supabase
      .channel(`shop-appointments-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "appointments",
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          // If it's a manual source (web booking)
          if (payload.new.source === "manual" && payload.new.status === "pending") {
            // We need customer details, but we only have customer_id. 
            // In a real app we'd fetch the customer name, but for a quick toast we can just say:
            setNotification("🔔 Yeni bir web randevu talebi geldi!");
            
            // Auto hide after 5 seconds
            setTimeout(() => {
              setNotification(null);
            }, 5000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [shopId]);

  if (!notification) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-white border-l-4 border-accent text-gray-900 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3">
        <div className="text-xl">🔔</div>
        <div>
          <div className="font-bold text-sm">Yeni Bildirim</div>
          <div className="text-sm font-medium text-gray-600">{notification}</div>
        </div>
        <button 
          onClick={() => setNotification(null)}
          className="ml-4 text-gray-400 hover:text-gray-900"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
