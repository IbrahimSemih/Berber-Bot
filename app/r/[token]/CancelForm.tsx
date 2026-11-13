'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

interface CancelFormProps {
  token: string;
}

export default function CancelForm({ token }: CancelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleCancel = () => {
    toast((t) => (
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="text-[var(--red)] w-5 h-5" />
          <span className="font-bold text-[var(--text)]">Emin misiniz?</span>
        </div>
        <p className="text-sm text-[var(--text2)]">Randevunuzu iptal etmek istediğinize emin misiniz?</p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1.5 text-xs rounded border border-[var(--border2)] text-[var(--text2)] hover:bg-[var(--bg4)]" onClick={() => toast.dismiss(t.id)}>Hayır, Vazgeç</button>
          <button className="px-3 py-1.5 text-xs rounded bg-[rgba(185,60,52,0.14)] text-[var(--red)] border border-[rgba(185,60,52,0.3)] hover:bg-[rgba(185,60,52,0.2)]" onClick={async () => {
            toast.dismiss(t.id);
            setIsLoading(true);
            setError(null);

            try {
              const res = await fetch('/api/appointments/cancel', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }),
              });

              const data = await res.json();

              if (!res.ok) {
                throw new Error(data.error || 'İptal işlemi başarısız oldu.');
              }

              setIsSuccess(true);
              router.refresh();
              toast.success("Randevunuz iptal edildi.");
            } catch (err: any) {
              setError(err.message);
              toast.error(err.message);
            } finally {
              setIsLoading(false);
            }
          }}>Evet, İptal Et</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  if (isSuccess) {
    return (
      <div className="mt-8 p-6 bg-[var(--red-dim)] border border-[rgba(185,60,52,0.25)] rounded-xl text-center animate-in fade-in zoom-in duration-300">
        <div className="w-12 h-12 bg-[rgba(185,60,52,0.14)] text-[var(--red)] rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-xl">✓</span>
        </div>
        <h3 className="text-[var(--red)] font-bold mb-2">Randevunuz İptal Edildi</h3>
        <p className="text-sm text-[var(--text3)]">
          İşletmeye bilgi verildi. Yeni bir randevu almak isterseniz WhatsApp üzerinden tekrar iletişime geçebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      {error && (
        <div className="mb-4 p-3 bg-[var(--red-dim)] border border-[rgba(185,60,52,0.25)] text-[var(--red)] rounded-lg text-sm text-center w-full">
          {error}
        </div>
      )}
      
      <button
        onClick={handleCancel}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl font-medium text-[var(--bg2)] transition-all
          ${isLoading 
            ? 'bg-[var(--red)] opacity-50 cursor-not-allowed' 
            : 'bg-[var(--red)] hover:opacity-90 shadow-lg shadow-[var(--shadow)] active:scale-[0.98]'
          }`}
      >
        {isLoading ? 'İptal Ediliyor...' : 'Randevuyu İptal Et'}
      </button>
      
      <p className="text-xs text-[var(--text3)] mt-4 text-center">
        İptal işlemi geri alınamaz. Yeni bir randevu almak isterseniz WhatsApp üzerinden tekrar iletişime geçebilirsiniz.
      </p>
    </div>
  );
}
