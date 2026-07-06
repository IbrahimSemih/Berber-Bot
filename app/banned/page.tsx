import Link from "next/link";
import { Button } from "@/components/ui";

export default function BannedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-4 font-heading text-gray-900">Hesabınız Askıya Alındı</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          Kullanım koşullarımızı ihlal ettiğiniz veya abonelik ödemeniz gerçekleşmediği için hesabınız geçici olarak durdurulmuştur. 
          Lütfen detaylı bilgi için bizimle iletişime geçin.
        </p>
        <Link href="/">
          <Button variant="ghost" className="w-full">
            Ana Sayfaya Dön
          </Button>
        </Link>
      </div>
    </div>
  );
}
