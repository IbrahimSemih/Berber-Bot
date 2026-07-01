"use client";
import { useState } from "react";
import { toggleShopStatus } from "../actions";

export default function StatusButton({ shopId, currentStatus }: { shopId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    if (currentStatus === "active" && !confirm("Bu dükkanı banlamak (askıya almak) istediğinize emin misiniz?")) {
      return;
    }
    
    setLoading(true);
    await toggleShopStatus(shopId, currentStatus);
    setLoading(false);
  };

  const isBanned = currentStatus === "banned";

  return (
    <button 
      onClick={handleToggle}
      disabled={loading}
      className="px-4 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5"
      style={{ 
        background: isBanned ? "var(--green)" : "rgba(255, 95, 87, 0.15)", 
        color: isBanned ? "#fff" : "var(--red)" 
      }}
    >
      {loading ? "İşleniyor..." : (isBanned ? "Aktifleştir" : "Askıya Al")}
    </button>
  );
}
