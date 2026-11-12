// İşletme paneli: kenar menüsü bütün panel sayfalarında ortak. Sayfa
// değişiminde menü yeniden kurulmaz; dükkan bilgisi ve canlı bildirim
// bağlantısı korunur. Route grubu URL'leri değiştirmez.
import AdminLayout from "@/components/layout/AdminLayout";

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayout>{children}</AdminLayout>;
}
