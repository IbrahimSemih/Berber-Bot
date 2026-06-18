"use client";
import { useState, useRef, useEffect } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardHeader, PageHeader, Badge } from "@/components/ui";

interface Message { text: string; out: boolean; time: string; }

const SERVICES = ["✂️ Saç Kesimi", "🪒 Sakal Düzeltme", "💈 Komple Paket", "💇 Çocuk Kesimi"];
const SLOTS: Record<string, string[]> = {
  "✂️ Saç Kesimi":    ["09:00", "10:30", "14:00", "16:30"],
  "🪒 Sakal Düzeltme":["10:00", "11:30", "15:00", "17:30"],
  "💈 Komple Paket":  ["11:00", "13:30", "15:30"],
  "💇 Çocuk Kesimi":  ["09:30", "12:00", "16:00"],
};

type Step = "idle" | "service" | "time" | "done";

const now = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

export default function WhatsAppPage() {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Merhaba! Randevu almak istiyorum 👋", out: false, time: now() },
    { text: "Merhaba! 😊 Hoş geldiniz. Hangi hizmeti almak istersiniz?", out: true, time: now() },
  ]);
  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typing]);

  function addMsg(text: string, out: boolean) {
    setMessages((prev) => [...prev, { text, out, time: now() }]);
  }

  function botReply(text: string) {
    setTyping(true);
    setTimeout(() => { setTyping(false); addMsg(text, true); }, 900);
  }

  function selectService(svc: string) {
    addMsg(svc, false);
    setSelectedService(svc);
    setStep("time");
    const slots = SLOTS[svc] ?? [];
    botReply(`Güzel seçim! 😊\n\n*${svc.replace(/^\S+\s/, "")}* için müsait saatler:\n${slots.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nBir numara gönderin.`);
  }

  function selectTime(slot: string) {
    addMsg(slot, false);
    setStep("done");
    botReply(`✅ *Randevunuz oluşturuldu!*\n\n📅 Yarın, ${slot}\n💈 ${selectedService?.replace(/^\S+\s/, "")}\n📍 Maestro Berber\n\nBir gün önce hatırlatma göndereceğim! 🔔`);
  }

  function reset() {
    setMessages([
      { text: "Merhaba! Randevu almak istiyorum 👋", out: false, time: now() },
      { text: "Merhaba! 😊 Hoş geldiniz. Hangi hizmeti almak istersiniz?", out: true, time: now() },
    ]);
    setStep("service");
    setSelectedService(null);
  }

  const flowSteps = [
    { num: 1, title: "Karşılama & Hizmet Seçimi", desc: "Müşteri 'randevu' veya 'merhaba' yazdığında bot devreye girer. Hizmetler buton olarak sunulur.", tag: "Tetikleyici: 'randevu', 'merhaba'" },
    { num: 2, title: "Tarih & Saat Seçimi", desc: "Hizmet seçildikten sonra müsait slotlar getirilir. Dolu saatler otomatik gizlenir.", tag: "API: /available-slots" },
    { num: 3, title: "Onay & Kayıt", desc: "Seçim yapıldı, randevu DB'ye yazılır. Müşteriye ve dükkan sahibine bildirim gider.", tag: "DB: INSERT appointments" },
    { num: 4, title: "Hatırlatma (24 saat önce)", desc: "Cron job çalışır, randevudan 1 gün önce otomatik WhatsApp mesajı gönderilir.", tag: "Cron: 0 9 * * *" },
    { num: 5, title: "İptal / Erteleme", desc: "Müşteri 'iptal' yazarsa bot yeni slot önerir. Admin panelde anlık güncellenir.", tag: "Tetikleyici: 'iptal', 'erteleme'" },
  ];

  return (
    <AdminLayout>
      <PageHeader title="WhatsApp Bot">
        <Badge color="green">Bot Aktif</Badge>
      </PageHeader>

      <div className="p-7 grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Chat simulator */}
        <div>
          <p className="text-xs mb-3" style={{ color: "var(--text3)" }}>
            Canlı Bot Simülasyonu — müşteri perspektifinden etkileşimli deneme
          </p>
          <div className="rounded-xl overflow-hidden" style={{ background: "#0b1a0f", border: "1px solid #1a3a1a" }}>
            {/* Chat header */}
            <div className="px-4 py-3 flex items-center gap-3" style={{ background: "#1a3a1a" }}>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg"
                style={{ background: "var(--accent)" }}>✂</div>
              <div>
                <div className="text-sm font-semibold">Maestro Berber</div>
                <div className="text-xs" style={{ color: "#4caf7d" }}>● Bot aktif</div>
              </div>
              <button onClick={reset} className="ml-auto text-xs px-3 py-1 rounded-lg border transition-colors"
                style={{ borderColor: "#2a5a2a", color: "#4caf7d", background: "transparent" }}>
                Sıfırla
              </button>
            </div>

            {/* Messages */}
            <div className="p-4 flex flex-col gap-3 overflow-y-auto" style={{ minHeight: 360, maxHeight: 420 }}>
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[78%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-line ${m.out ? "self-end" : "self-start"}`}
                  style={{ background: m.out ? "#1a3a28" : "#1e2d1e", color: m.out ? "#e8f8e8" : "#d4f0c4", borderBottomRightRadius: m.out ? 2 : 10, borderBottomLeftRadius: m.out ? 10 : 2 }}>
                  {m.text}
                  <span className="block mt-1 opacity-50">{m.time}</span>
                </div>
              ))}
              {typing && (
                <div className="self-start px-3 py-2.5 rounded-xl" style={{ background: "#1e2d1e" }}>
                  <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((d, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: "#4caf7d", animation: `bounce 1.2s ${d}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick replies */}
            <div className="px-4 pb-4 flex flex-wrap gap-2">
              {step === "service" && SERVICES.map((s) => (
                <button key={s} onClick={() => selectService(s)}
                  className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                  style={{ borderColor: "#2a5a2a", color: "#4caf7d", background: "transparent" }}>
                  {s}
                </button>
              ))}
              {step === "time" && selectedService && (SLOTS[selectedService] ?? []).map((slot) => (
                <button key={slot} onClick={() => selectTime(slot)}
                  className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                  style={{ borderColor: "#2a5a2a", color: "#4caf7d", background: "transparent" }}>
                  {slot}
                </button>
              ))}
              {step === "done" && (
                <button onClick={reset}
                  className="px-3 py-1.5 rounded-full text-xs border transition-colors"
                  style={{ borderColor: "#2a5a2a", color: "#4caf7d", background: "transparent" }}>
                  🔄 Yeni Randevu
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Flow steps */}
        <Card>
          <CardHeader title="Bot Akış Adımları" />
          <div className="p-5 flex flex-col">
            {flowSteps.map((s, i) => (
              <div key={s.num} className="flex gap-3 py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black font-syne flex-shrink-0 mt-0.5"
                  style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim2)", color: "var(--accent)" }}>
                  {s.num}
                </div>
                <div>
                  <div className="text-sm font-medium mb-0.5">{s.title}</div>
                  <div className="text-xs leading-relaxed mb-2" style={{ color: "var(--text3)" }}>{s.desc}</div>
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: "var(--bg3)", border: "1px solid var(--border2)", color: "var(--text3)" }}>
                    {s.tag}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <style>{`
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);opacity:.5} 30%{transform:translateY(-5px);opacity:1} }
      `}</style>
    </AdminLayout>
  );
}
