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

const DAYS = [
  { id: 1, label: "Pzt" },
  { id: 2, label: "Sal" },
  { id: 3, label: "Çar" },
  { id: 4, label: "Per" },
  { id: 5, label: "Cum" },
  { id: 6, label: "Cmt" },
  { id: 0, label: "Paz" },
];

export default function OnboardingPage() {
  // States
  const [shopName, setShopName] = useState("");
  const [workStart, setWorkStart] = useState("09:00");
  const [workEnd, setWorkEnd] = useState("20:00");
  const [workDays, setWorkDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [staffNameInput, setStaffNameInput] = useState("");
  const [staffMembers, setStaffMembers] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");
  
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
        setUserEmail(user.email || "");
        
        // Check if user already has a shop, if so, redirect to dashboard
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

  const toggleDay = (dayId: number) => {
    if (workDays.includes(dayId)) {
      setWorkDays(workDays.filter(d => d !== dayId));
    } else {
      setWorkDays([...workDays, dayId].sort());
    }
  };

  const addStaff = () => {
    if (staffNameInput.trim() && !staffMembers.includes(staffNameInput.trim())) {
      setStaffMembers([...staffMembers, staffNameInput.trim()]);
      setStaffNameInput("");
    }
  };

  const removeStaff = (name: string) => {
    setStaffMembers(staffMembers.filter((s) => s !== name));
  };

  const handleCreateShop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);
    setError(null);

    const slug = generateSlug(shopName) + "-" + Math.floor(Math.random() * 1000);

    const trialEndDate = new Date();
    trialEndDate.setDate(trialEndDate.getDate() + 7);

    // 1. Create Shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .insert([
        {
          name: shopName,
          slug: slug,
          owner_id: userId,
          plan_id: 'pro',
          subscription_status: 'trialing',
          trial_end: trialEndDate.toISOString(),
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

    // 2. Create Default Settings with working hours
    const working_hours = [1, 2, 3, 4, 5, 6, 0].map(day => ({
      day,
      is_open: workDays.includes(day),
      start: workStart,
      end: workEnd
    }));

    const { error: settingsError } = await supabase
      .from("settings")
      .insert([
        {
          shop_id: shopId,
          shop_name: shopName,
          work_start: workStart,
          work_end: workEnd,
          work_days: workDays,
          working_hours: working_hours
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

    // 4. Create Staff Members
    if (staffMembers.length > 0) {
      const staffInserts = staffMembers.map(name => ({
        shop_id: shopId,
        name: name,
        is_active: true
      }));
      const { error: staffError } = await supabase.from("staff").insert(staffInserts);
      if (staffError) console.error("Staff error:", staffError);
    } else {
      // Varsayılan bir personel ekle
      await supabase.from("staff").insert([{ shop_id: shopId, name: "İşletme Sahibi", is_active: true }]);
    }

    // Send welcome email now that onboarding is complete
    if (userEmail) {
      try {
        await fetch('/api/emails/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            email: userEmail, 
            name: userEmail.split('@')[0], 
            type: 'welcome' 
          }),
        });
      } catch (err) {
        console.error("Failed to send welcome email:", err);
      }
    }

    // All done, redirect to dashboard
    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12" style={{ background: "var(--bg)", color: "var(--text)" }}>
      <div className="max-w-xl w-full p-8 rounded-2xl border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mx-auto mb-4"
            style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>✂</div>
          <h1 className="font-heading font-bold text-2xl mb-2">Hoş Geldiniz!</h1>
          <p className="text-sm font-light" style={{ color: "var(--text3)" }}>
            BerberBot'u kullanmaya başlamak için dükkanınızı yapılandırın.
          </p>
        </div>

        <form onSubmit={handleCreateShop} className="space-y-8">
          {/* Bölüm 1: Dükkan Adı */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2" style={{ borderColor: "var(--border)" }}>1. Temel Bilgiler</h2>
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
          </div>

          {/* Bölüm 2: Çalışma Saatleri */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2" style={{ borderColor: "var(--border)" }}>2. Çalışma Saatleri</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>Açılış Saati</label>
                <input
                  type="time"
                  value={workStart}
                  onChange={(e) => setWorkStart(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none"
                  style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>Kapanış Saati</label>
                <input
                  type="time"
                  value={workEnd}
                  onChange={(e) => setWorkEnd(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg text-sm border focus:outline-none"
                  style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-3" style={{ color: "var(--text2)" }}>Çalışma Günleri</label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const isSelected = workDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => toggleDay(day.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border`}
                      style={{
                        background: isSelected ? "var(--accent)" : "transparent",
                        color: isSelected ? "#0a0a0a" : "var(--text2)",
                        borderColor: isSelected ? "var(--accent)" : "var(--border)"
                      }}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bölüm 3: Personeller */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold border-b pb-2" style={{ borderColor: "var(--border)" }}>3. Personeller</h2>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
                Personel Ekle
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={staffNameInput}
                  onChange={(e) => setStaffNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addStaff();
                    }
                  }}
                  placeholder="Personel Adı (Örn: Ahmet)"
                  className="flex-1 px-4 py-3 rounded-lg text-sm border focus:outline-none"
                  style={{ background: "transparent", borderColor: "var(--border)", color: "var(--text)" }}
                />
                <button
                  type="button"
                  onClick={addStaff}
                  className="px-6 py-3 rounded-lg text-sm font-bold transition-colors"
                  style={{ background: "var(--bg3)", color: "var(--text)" }}
                >
                  Ekle
                </button>
              </div>
              
              {staffMembers.length > 0 ? (
                <div className="flex flex-wrap gap-2 mt-4">
                  {staffMembers.map((staff, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm" style={{ borderColor: "var(--border)", background: "rgba(0,0,0,0.2)" }}>
                      <span>{staff}</span>
                      <button type="button" onClick={() => removeStaff(staff)} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-red-500/20 hover:text-red-500 transition-colors">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs mt-2" style={{ color: "var(--text3)" }}>Hiç personel eklemezseniz "İşletme Sahibi" adında varsayılan bir personel oluşturulur.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !shopName}
            className="w-full py-4 mt-8 rounded-xl text-base font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}
          >
            {loading ? "Sistem Kuruluyor..." : "Dükkanımı Oluştur ve Başla"}
          </button>
        </form>
      </div>
    </div>
  );
}
