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
          <AlertTriangle className="text-red-500 w-5 h-5" />
          <span className="font-bold text-white">Emin misiniz?</span>
        </div>
        <p className="text-sm text-neutral-300">Randevunuzu iptal etmek istediğinize emin misiniz?</p>
        <div className="flex justify-end gap-2 mt-2">
          <button className="px-3 py-1.5 text-xs rounded border border-neutral-700 text-neutral-300 hover:bg-neutral-800" onClick={() => toast.dismiss(t.id)}>Hayır, Vazgeç</button>
          <button className="px-3 py-1.5 text-xs rounded bg-red-500/20 text-red-500 border border-red-500/30 hover:bg-red-500/30" onClick={async () => {
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
      <div className="mt-8 p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center animate-in fade-in zoom-in duration-300">
        <div className="w-12 h-12 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-xl">✓</span>
        </div>
        <h3 className="text-red-500 font-bold mb-2">Randevunuz İptal Edildi</h3>
        <p className="text-sm text-neutral-400">
          İşletmeye bilgi verildi. Yeni bir randevu almak isterseniz WhatsApp üzerinden tekrar iletişime geçebilirsiniz.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col items-center">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-sm text-center w-full">
          {error}
        </div>
      )}
      
      <button
        onClick={handleCancel}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all
          ${isLoading 
            ? 'bg-red-500/50 cursor-not-allowed' 
            : 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/20 active:scale-[0.98]'
          }`}
      >
        {isLoading ? 'İptal Ediliyor...' : 'Randevuyu İptal Et'}
      </button>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        İptal işlemi geri alınamaz. Yeni bir randevu almak isterseniz WhatsApp üzerinden tekrar iletişime geçebilirsiniz.
      </p>
    </div>
  );
}
