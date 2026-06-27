"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export default function OnboardingPage() {
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Fetch the current user on mount
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUserId(user.id);
        
        // Optional: Check if user already has a shop, if so, redirect to dashboard
        const { data: shop } = await supabase
          .from("shops")
          .select("id")
          .eq("owner_id", user.id)
          .single();
          
        if (shop) {
          router.push("/dashboard");
        }
      }
    };
    fetchUser();
  }, [router, supabase]);

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    setError(null);

    const slug = generateSlug(shopName) + "-" + Math.floor(Math.random() * 1000);

    // 1. Create Shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .insert([
        {
          name: shopName,
          slug: slug,
          owner_id: userId,
        },
      ])
      .select()
      .single();

    if (shopError) {
      setError("Dükkan oluşturulurken hata: " + shopError.message);
      setLoading(false);
      return;
    }

    const shopId = shop.id;

    // 2. Create Default Settings
    const { error: settingsError } = await supabase
      .from("settings")
      .insert([
        {
          shop_id: shopId,
          shop_name: shopName,
        },
      ]);

    if (settingsError) {
      console.error("Settings error:", settingsError);
    }

    // 3. Create Default Services
    const { error: servicesError } = await supabase
      .from("services")
      .insert([
        { shop_id: shopId, name: "Saç Kesimi", duration_minutes: 30, price: 150 },
        { shop_id: shopId, name: "Sakal Düzeltme", duration_minutes: 20, price: 80 },
        { shop_id: shopId, name: "Komple Paket", duration_minutes: 45, price: 200 }
      ]);

    if (servicesError) {
      console.error("Services error:", servicesError);
    }

    // All done, redirect to dashboard
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-md w-full p-8 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>✂</div>
          <h1 className="font-heading font-bold text-2xl mb-2">Hoş Geldiniz!</h1>
          <p className="text-sm font-light" style={{ color: "var(--text3)" }}>
            BerberBot'u kullanmaya başlamak için dükkanınızın adını girin.
          </p>
        </div>

        <form onSubmit={handleCreateShop} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
              Dükkan Adı
            </label>
            <input
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="Örn: Maestro Berber"
              className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none"
              style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text)" }}
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !shopName}
            className="w-full py-3.5 rounded-xl text-base font-semibold transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}
          >
            {loading ? "Kuruluyor..." : "Dükkanımı Oluştur"}
          </button>
        </form>
      </div>
    </div>
  );
}
