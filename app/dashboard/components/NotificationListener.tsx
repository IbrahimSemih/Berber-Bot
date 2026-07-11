"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function NotificationListener({ shopId, onNewNotification }: { shopId: string, onNewNotification?: () => void }) {
  const [notification, setNotification] = useState<{type: string, message: string} | null>(null);

  useEffect(() => {
    if (!shopId) return;

    const supabase = createClient();

    // Subscribe to notifications for this shop
    const channel = supabase
      .channel(`shop-notifications-global-${shopId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `shop_id=eq.${shopId}`,
        },
        async (payload) => {
          const notif = payload.new;
          setNotification({ type: notif.type, message: notif.message });
          if (onNewNotification) onNewNotification();
          
          setTimeout(() => setNotification(null), 5000);
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
        <div className="text-xl">
          {notification.type === 'cancel' ? '❌' : notification.type === 'new_booking' ? '🔔' : 'ℹ️'}
        </div>
        <div>
          <div className="font-bold text-sm">Yeni Bildirim</div>
          <div className="text-sm font-medium text-gray-600">{notification.message}</div>
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
