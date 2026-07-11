'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface CancelFormProps {
  token: string;
}

export default function CancelForm({ token }: CancelFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm('Randevunuzu iptal etmek istediğinize emin misiniz?')) {
      return;
    }

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
      // Başarılı olursa sayfayı yenile, böylece iptal edildiği durumu gösterilsin
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
