"use client";
import { useState } from "react";
import { toggleShopStatus } from "../actions";
import { toast } from "react-hot-toast";
import { AlertTriangle } from "lucide-react";

export default function StatusButton({ shopId, currentStatus }: { shopId: string, currentStatus: string }) {
  const [loading, setLoading] = useState(false);

  const handleToggle = () => {
    if (currentStatus === "active") {
      toast((t) => (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500 w-5 h-5" />
            <span className="font-bold">Emin misiniz?</span>
          </div>
          <p className="text-sm">Bu dükkanı banlamak (askıya almak) istediğinize emin misiniz?</p>
          <div className="flex justify-end gap-2 mt-2">
            <button className="px-3 py-1.5 text-xs rounded border hover:bg-neutral-100 dark:border-neutral-700 dark:hover:bg-neutral-800" onClick={() => toast.dismiss(t.id)}>İptal</button>
            <button className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30" onClick={async () => {
              toast.dismiss(t.id);
              setLoading(true);
              await toggleShopStatus(shopId, currentStatus);
              setLoading(false);
              toast.success("Dükkan askıya alındı.");
            }}>Evet, Askıya Al</button>
          </div>
        </div>
      ), { duration: Infinity });
    } else {
      // Direct toggle if not active
      setLoading(true);
      toggleShopStatus(shopId, currentStatus).then(() => {
        setLoading(false);
        toast.success("Dükkan aktifleştirildi.");
      });
    }
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
