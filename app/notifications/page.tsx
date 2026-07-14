"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { markAsRead, markAllAsRead, clearAllNotifications } from "./actions";
import AdminLayout from "@/components/layout/AdminLayout";
import { toast } from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

interface Notification {
  id: string;
  shop_id: string;
  type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function NotificationsPage() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchNotifications() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: shop } = await supabase
        .from("shops")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (shop) {
        setShopId(shop.id);
        const { data } = await supabase
          .from("notifications")
          .select("*")
          .eq("shop_id", shop.id)
          .order("created_at", { ascending: false });

        setNotifications(data || []);
      }
      setLoading(false);
    }
    fetchNotifications();

    // Dinleyiciyi de ekleyelim ki sayfadayken yeni geleni anında görelim
    if (shopId) {
      const channel = supabase
        .channel(`shop-notifications-${shopId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `shop_id=eq.${shopId}`,
          },
          (payload) => {
            setNotifications((prev) => [payload.new as Notification, ...prev]);
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      }
    }
  }, [supabase, shopId]);

  const handleMarkAsRead = async (id: string) => {
    setNotifications((prev) => 
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    await markAsRead(id);
  };

  const handleMarkAllAsRead = async () => {
    if (!shopId) return;
    setNotifications((prev) => prev.map(n => ({ ...n, is_read: true })));
    await markAllAsRead(shopId);
  };

  const handleClearAll = async () => {
    if (!shopId) return;
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-red-500 w-5 h-5" />
          <span className="font-bold">Emin misiniz?</span>
        </div>
        <p className="text-sm">Tüm bildirimleri silmek istediğinize emin misiniz?</p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1.5 text-xs rounded border border-neutral-700 hover:bg-neutral-800" onClick={() => toast.dismiss(t.id)}>İptal</button>
          <button className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30" onClick={async () => {
            toast.dismiss(t.id);
            setNotifications([]);
            await clearAllNotifications(shopId);
            toast.success("Bildirimler temizlendi.");
          }}>Evet, Temizle</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="p-8">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Bildirimler</h1>
            <p className="text-neutral-400">Gelen bildirimlerinizi buradan takip edebilirsiniz.</p>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleMarkAllAsRead}
              className="px-4 py-2 text-sm bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition"
            >
              Tümünü Okundu İşaretle
            </button>
            <button 
              onClick={handleClearAll}
              className="px-4 py-2 text-sm bg-red-900/50 hover:bg-red-900/80 text-red-100 rounded-lg transition border border-red-800"
            >
              Tümünü Temizle
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {notifications.length === 0 ? (
            <div className="p-12 text-center border border-neutral-800 rounded-2xl bg-neutral-900/50">
              <p className="text-neutral-400">Henüz hiç bildiriminiz yok.</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                className={`p-5 rounded-2xl border transition flex gap-4 items-start ${
                  notif.is_read 
                    ? "bg-neutral-900 border-neutral-800 opacity-70" 
                    : "bg-neutral-800 border-neutral-600 cursor-pointer shadow-lg"
                }`}
              >
                <div className="text-2xl mt-1">
                  {notif.type === "cancel" ? "❌" : notif.type === "new_booking" ? "🔔" : "ℹ️"}
                </div>
                <div className="flex-1">
                  <p className={`text-base ${notif.is_read ? "text-neutral-300" : "text-white font-semibold"}`}>
                    {notif.message}
                  </p>
                  <p className="text-xs text-neutral-500 mt-2">
                    {new Date(notif.created_at).toLocaleString("tr-TR")}
                  </p>
                </div>
                {!notif.is_read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-accent mt-2 shadow-[0_0_8px_var(--accent)]" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
