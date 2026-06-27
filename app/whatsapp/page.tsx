"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { PageHeader, Card, Button } from "@/components/ui";

const API_URL = "http://localhost:3001/api/whatsapp";

export default function WhatsappPage() {
  const [shopId, setShopId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("LOADING"); // LOADING, DISCONNECTED, INITIALIZING, QR_READY, CONNECTED
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function loadShop() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: shop } = await supabase.from("shops").select("id").eq("owner_id", user.id).single();
      if (shop) {
        setShopId(shop.id);
      }
    }
    loadShop();
  }, [supabase]);

  // Poll status every 3 seconds if we have a shopId
  useEffect(() => {
    if (!shopId) return;

    const checkStatus = async () => {
      try {
        const res = await fetch(`${API_URL}/status?shopId=${shopId}`);
        const data = await res.json();
        setStatus(data.status);
        setQrCodeUrl(data.qrCodeUrl || null);
        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch WhatsApp status", error);
        setStatus("DISCONNECTED");
        setLoading(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [shopId]);

  const handleConnect = async () => {
    if (!shopId) return;
    setStatus("INITIALIZING");
    try {
      await fetch(`${API_URL}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId })
      });
    } catch (e) {
      console.error(e);
      setStatus("DISCONNECTED");
    }
  };

  const handleLogout = async () => {
    if (!shopId) return;
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId })
      });
      setStatus("DISCONNECTED");
      setQrCodeUrl(null);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      <PageHeader title="WhatsApp Bot Bağlantısı" />
      <div className="p-7 max-w-2xl">
        <Card>
          <div className="p-8 flex flex-col items-center text-center">
            
            {loading ? (
              <div className="text-gray-500">Durum kontrol ediliyor...</div>
            ) : status === "CONNECTED" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-3xl mb-4">
                  ✓
                </div>
                <h2 className="text-2xl font-bold mb-2">WhatsApp Bağlı</h2>
                <p className="text-gray-500 mb-8">
                  BerberBot şu anda telefonunuza bağlı ve gelen randevu mesajlarına otomatik yanıt veriyor.
                </p>
                <Button variant="danger" onClick={handleLogout}>Bağlantıyı Kes</Button>
              </>
            ) : status === "INITIALIZING" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-3xl mb-4 animate-pulse">
                  ⏳
                </div>
                <h2 className="text-2xl font-bold mb-2">QR Kod Hazırlanıyor...</h2>
                <p className="text-gray-500">
                  Lütfen bekleyin, WhatsApp bağlantısı başlatılıyor. Bu işlem birkaç saniye sürebilir.
                </p>
              </>
            ) : status === "QR_READY" && qrCodeUrl ? (
              <>
                <h2 className="text-2xl font-bold mb-2">QR Kodu Okutun</h2>
                <p className="text-gray-500 mb-6">
                  WhatsApp'ı açın, Ayarlar {">"} Bağlı Cihazlar menüsüne gidin ve kameranızı aşağıdaki koda tutun.
                </p>
                <div className="p-4 bg-white border rounded-xl shadow-sm mb-6 inline-block">
                  <img src={qrCodeUrl} alt="WhatsApp QR Code" className="w-64 h-64" />
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-3xl mb-4">
                  📱
                </div>
                <h2 className="text-2xl font-bold mb-2">WhatsApp Bağlantısı Yok</h2>
                <p className="text-gray-500 mb-8">
                  Botun otomatik olarak çalışabilmesi için işletmenizin WhatsApp hesabını sisteme bağlamanız gerekir.
                </p>
                <Button onClick={handleConnect}>WhatsApp'ı Bağla</Button>
              </>
            )}

          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
