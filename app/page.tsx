import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── NAV ── */}
      <nav style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,10,0.9)" }}
        className="fixed top-0 left-0 right-0 h-16 flex items-center px-12 gap-5 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
          <span className="font-syne font-black text-lg tracking-tight">BerberBot</span>
        </div>
        <div className="flex items-center gap-7 ml-auto">
          <a href="#features" className="text-sm" style={{ color: "var(--text3)" }}>Özellikler</a>
          <a href="#pricing" className="text-sm" style={{ color: "var(--text3)" }}>Fiyatlar</a>
          <Link href="/login"
            className="text-sm px-4 py-2 rounded-lg border font-medium transition-colors"
            style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
            Giriş Yap
          </Link>
          <Link href="/dashboard"
            className="text-sm px-4 py-2 rounded-lg font-semibold transition-colors"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>
            Ücretsiz Dene
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center px-20 pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: "radial-gradient(circle at top right, rgba(200,240,96,0.06), transparent 70%)" }} />

        <div className="max-w-xl relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium mb-8"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim2)", color: "var(--accent)" }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
            WhatsApp üzerinden otomatik randevu
          </div>
          <h1 className="font-syne font-black text-6xl leading-none tracking-tighter mb-6">
            Berberlik<br />değil<br />
            <span style={{ color: "var(--accent)" }}>Teknoloji</span><br />
            sürüyor.
          </h1>
          <p className="text-lg mb-10 leading-relaxed font-light" style={{ color: "var(--text2)" }}>
            Müşterileriniz WhatsApp&apos;tan randevu alırken siz işinize bakın. Otomatik hatırlatmalar, akıllı takvim, sıfır telefon trafiği.
          </p>
          <div className="flex items-center gap-4">
            <button className="px-7 py-3.5 rounded-xl text-base font-medium border transition-colors"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              Demo İzle
            </button>
          </div>
        </div>

        {/* Phone mockup */}
        <div className="absolute right-20 top-1/2 -translate-y-1/2 w-72">
          <div className="rounded-[2rem] overflow-hidden shadow-2xl border-2" style={{ background: "#111", borderColor: "#2a2a2a" }}>
            <div className="h-7 flex items-center justify-center" style={{ background: "#0a0a0a" }}>
              <div className="w-16 h-1 rounded-full" style={{ background: "#1a1a1a" }} />
            </div>
            <div style={{ background: "#0b1a0f" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: "#128c3e" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                  style={{ background: "var(--accent)" }}>✂</div>
                <div>
                  <div className="text-xs font-semibold">Maestro Berber</div>
                  <div className="text-xs opacity-70">çevrimiçi</div>
                </div>
              </div>
              <div className="p-3 flex flex-col gap-2">
                {[
                  { text: "Randevu almak istiyorum 👋", out: false },
                  { text: "Hoş geldiniz! 😊 Hangi hizmeti istersiniz?", out: true },
                  { text: "Komple paket", out: false },
                  { text: "✅ Yarın 15:30 randevunuz oluşturuldu!", out: true },
                ].map((m, i) => (
                  <div key={i} className={`max-w-[80%] px-3 py-2 rounded-lg text-xs leading-snug ${m.out ? "self-end" : "self-start"}`}
                    style={{ background: m.out ? "#1a3a28" : "#1e2d1e", color: m.out ? "#e8f8e8" : "#d4f0c4", borderBottomRightRadius: m.out ? 2 : 8, borderBottomLeftRadius: m.out ? 8 : 2 }}>
                    {m.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-20 py-20">
        <h2 className="font-syne font-black text-4xl text-center mb-4 tracking-tight">Neden BerberBot?</h2>
        <p className="text-center mb-14 font-light" style={{ color: "var(--text3)" }}>
          Tek bir sistem ile randevu kargaşasına son.
        </p>
        <div className="grid grid-cols-3 gap-5">
          {[
            { icon: "🤖", title: "Akıllı Bot Akışı", desc: "Müşteri doğal dilde yazıyor, bot hizmeti ve saati otomatik anlıyor. Siz hiçbir şeye dokunmuyorsunuz." },
            { icon: "📅", title: "Gerçek Zamanlı Takvim", desc: "Günlük/haftalık randevu görünümü. Çakışma imkânsız — bot dolu saatleri otomatik atlıyor." },
            { icon: "🔔", title: "Otomatik Hatırlatma", desc: "Randevudan 24 saat önce müşteriye WhatsApp mesajı. İptal & erteleme de bottan halloluyor." },
            { icon: "📊", title: "Gelir Takibi", desc: "Aylık ciro, en çok tercih edilen hizmetler, müşteri sıklığı. Her şey tek ekranda." },
            { icon: "⚡", title: "5 Dakikada Kurulum", desc: "WhatsApp Business numaranı bağla, hizmetlerini ekle, bitir. Teknik bilgi gerektirmiyor." },
            { icon: "🇹🇷", title: "Türkçe & Yerel", desc: "Tamamen Türkçe arayüz, TL fiyatlandırma, yerel destek ekibi." },
          ].map((f) => (
            <div key={f.title} className="p-7 rounded-xl border transition-all hover:-translate-y-0.5 cursor-default"
              style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-4"
                style={{ background: "var(--accent-dim)" }}>{f.icon}</div>
              <h3 className="font-syne font-bold text-base mb-2">{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text3)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-20 py-20 text-center">
        <h2 className="font-syne font-black text-4xl mb-3 tracking-tight">Şeffaf Fiyatlandırma</h2>
        <p className="mb-14 font-light" style={{ color: "var(--text3)" }}>Gizli ücret yok. İstediğin zaman iptal.</p>
        <div className="grid grid-cols-3 gap-5 max-w-3xl mx-auto">
          {[
            { plan: "Başlangıç", price: "₺199", desc: "Tek berber, temel özellikler", features: ["Aylık 200 randevu", "WhatsApp Bot", "Admin Panel", "Hatırlatma mesajları"], popular: false },
            { plan: "Profesyonel", price: "₺349", desc: "Büyüyen dükkanlar için", features: ["Sınırsız randevu", "3 çalışan profili", "Gelir & analitik raporu", "Online ödeme entegrasyonu", "Öncelikli destek"], popular: true },
            { plan: "Franchise", price: "₺799", desc: "Birden fazla şube", features: ["Sınırsız şube", "Merkezi yönetim", "Özel bot kişiselleştirme", "API erişimi", "Özel destek"], popular: false },
          ].map((p) => (
            <div key={p.plan} className="p-7 rounded-xl border text-left relative"
              style={{ background: p.popular ? "linear-gradient(to bottom, rgba(200,240,96,0.05), var(--bg2))" : "var(--bg2)", borderColor: p.popular ? "var(--accent)" : "var(--border)" }}>
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-black font-syne"
                  style={{ background: "var(--accent)", color: "#0a0a0a" }}>EN POPÜLER</div>
              )}
              <div className="text-xs font-bold uppercase tracking-widest mb-2 font-syne" style={{ color: "var(--text3)" }}>{p.plan}</div>
              <div className="font-syne font-black text-4xl mb-1 tracking-tight">{p.price}<span className="text-base font-normal" style={{ color: "var(--text3)" }}>/ay</span></div>
              <div className="text-xs mb-5" style={{ color: "var(--text3)" }}>{p.desc}</div>
              <ul className="flex flex-col gap-2 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="text-sm flex items-center gap-2" style={{ color: "var(--text2)" }}>
                    <span style={{ color: "var(--accent)" }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/dashboard"
                className="block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors"
                style={p.popular ? { background: "var(--accent)", color: "#0a0a0a" } : { border: "1px solid var(--border2)", color: "var(--text2)" }}>
                {p.popular ? "14 Gün Ücretsiz" : "Başla"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-20 py-10 border-t text-sm text-center" style={{ borderColor: "var(--border)", color: "var(--text3)" }}>
        © 2024 BerberBot. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
