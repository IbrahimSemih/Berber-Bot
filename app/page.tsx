"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS, TRIAL_DAYS, YEARLY_REFUND_DAYS } from "@/lib/plan-limits";
import { REMINDER_HOURS_BEFORE } from "@/lib/booking";
import SiteFooter from "@/components/SiteFooter";
import {
  Link2, CalendarDays, BellRing, TrendingUp, QrCode, XCircle, ArrowRight, CheckCircle2,
  Smile, Mic, CheckCheck, Menu, X, Store, Share2, MessageCircle, Building2,
} from "lucide-react";

const PRO_FEATURES = [
  "Sınırsız randevu ve personel",
  "Size özel online randevu sayfası",
  "WhatsApp onay, hatırlatma ve iptal mesajları",
  "Müşterinin kendi iptal edebildiği bağlantı",
  "Personel izinleri ve çalışma saatleri",
  "Yazdırılabilir QR kod afişi",
  "Gelir ve randevu analitiği",
  "E-posta ile destek",
];

const FAQS = [
  {
    q: "Müşterilerim nasıl randevu alacak?",
    a: "Size özel bir randevu linkiniz olur (ör. berberbot.com/dukkaniniz). Bu linki Instagram biyografinize, Google İşletme profilinize ve WhatsApp durumunuza eklersiniz; dükkanda da hazır QR afişini asarsınız. Müşteri linke girip hizmeti, personeli ve boş saati seçer; 1 dakikada randevu alır.",
  },
  {
    q: "WhatsApp mesajları hangi numaradan gidiyor?",
    a: "Onay, hatırlatma ve iptal mesajları BerberBot'un resmi WhatsApp Business bildirim numarasından gönderilir ve mesajda dükkanınızın adı yazar. Şu an kendi WhatsApp numaranızı bağlama ve WhatsApp üzerinden sohbetle randevu alma desteklenmiyor.",
  },
  {
    q: "Teknik bilgiye ihtiyacım var mı?",
    a: "Hayır. Kayıt olduktan sonra dükkan adınızı, çalışma saatlerinizi, hizmetlerinizi ve personelinizi girmeniz yeterli; randevu linkiniz anında hazır olur.",
  },
  {
    q: "Randevuları nereden takip edeceğim?",
    a: "Telefonunuzdan veya bilgisayarınızdan yönetim panelinize girersiniz. Yeni randevu ya da iptal geldiğinde panelde anında bildirim görürsünüz. Telefonla aldığınız randevuları da panelden ekleyebilirsiniz.",
  },
  {
    q: "Ücretsiz deneme nasıl işliyor?",
    a: `${TRIAL_DAYS} gün boyunca tüm özellikleri ücretsiz kullanırsınız; kredi kartı istenmez. Deneme bitince sizden otomatik ücret alınmaz, devam etmek isterseniz panelden ödeme yaparsınız.`,
  },
  {
    q: "İptal edersem ne olur? İade var mı?",
    a: `Otomatik yenileme yoktur; yenilemezseniz aboneliğiniz dönem sonunda kendiliğinden biter. Yıllık planda ilk ${YEARLY_REFUND_DAYS} gün içinde ücretin tamamı koşulsuz iade edilir.`,
  },
  {
    q: "Müşterilerimin bilgileri güvende mi?",
    a: "Müşteri bilgileri yalnızca randevu hizmeti için kullanılır, asla satılmaz veya reklam için paylaşılmaz. Veriler KVKK'ya uygun şekilde, şifreli bağlantılar üzerinden saklanır.",
  },
];

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [yearly, setYearly] = useState(false);
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const navLinks = [
    { href: "#features", label: "Özellikler" },
    { href: "#how", label: "Nasıl Çalışır?" },
    { href: "#pricing", label: "Fiyatlar" },
    { href: "#faq", label: "SSS" },
  ];

  const price = yearly ? PLANS.pro.yearlyPrice : PLANS.pro.price;

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,10,0.8)" }}
        className="fixed top-0 left-0 right-0 h-16 flex items-center px-4 md:px-12 gap-5 z-50 backdrop-blur-md">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shadow-[0_0_15px_rgba(200,240,96,0.3)]"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
          <span className="font-heading font-black text-xl tracking-tight">BerberBot</span>
        </Link>
        <div className="hidden md:flex items-center gap-7 ml-auto">
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium hover:text-white transition-colors" style={{ color: "var(--text3)" }}>{l.label}</a>
          ))}
          <Link href="/login"
            className="text-sm px-5 py-2 rounded-lg border font-medium transition-all hover:bg-white/5"
            style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
            Giriş Yap
          </Link>
          <Link href="/signup"
            className="text-sm px-5 py-2 rounded-lg font-bold transition-all hover:scale-105 shadow-[0_0_20px_rgba(200,240,96,0.2)]"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>
            Ücretsiz Dene
          </Link>
        </div>
        <button className="md:hidden ml-auto p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Menüyü aç/kapat" aria-expanded={mobileMenuOpen}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 p-6 flex flex-col gap-4 border-b md:hidden"
            style={{ background: "rgba(10,10,10,0.95)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}>
            {navLinks.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-2" style={{ color: "var(--text2)" }}>{l.label}</a>
            ))}
            <Link href="/login" className="text-base font-medium py-2" style={{ color: "var(--text2)" }}>Giriş Yap</Link>
            <Link href="/signup" className="text-center py-3 rounded-xl font-bold" style={{ background: "var(--accent)", color: "#0a0a0a" }}>Ücretsiz Dene</Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center px-6 md:px-20 pt-24 pb-16 relative">
        <div
          className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full blur-[100px] pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.1) 0%, transparent 70%)" }}
        />

        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-2xl relative z-10">
          <motion.div variants={fadeIn}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold mb-8 shadow-[0_0_15px_rgba(200,240,96,0.15)]"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim2)", color: "var(--accent)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--accent)" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--accent)" }}></span>
            </span>
            Online Randevu + WhatsApp Bildirimleri
          </motion.div>

          <motion.h1 variants={fadeIn}
            className="font-heading font-black text-5xl md:text-6xl lg:text-8xl leading-[1.1] tracking-tighter mb-6">
            Berberlik<br />değil<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 40px rgba(200,240,96,0.3)" }}>Teknoloji</span><br />
            sürüyor.
          </motion.h1>

          <motion.p variants={fadeIn}
            className="text-base md:text-xl mb-10 leading-relaxed font-light max-w-lg" style={{ color: "var(--text2)" }}>
            Müşterileriniz size özel linkten 7/24 randevu alsın; onay, hatırlatma ve iptal mesajları WhatsApp&apos;tan otomatik gitsin.
            Telefon trafiği yok, unutulan randevu yok.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/signup" className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_30px_rgba(200,240,96,0.25)]"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              {TRIAL_DAYS} Gün Ücretsiz Dene <ArrowRight size={20} />
            </Link>
            <a href="#how" className="px-8 py-4 rounded-xl text-lg font-medium border transition-colors hover:bg-white/5 flex items-center gap-2"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              Nasıl Çalışır?
            </a>
          </motion.div>
          <motion.p variants={fadeIn} className="mt-5 text-sm" style={{ color: "var(--text3)" }}>
            Kredi kartı gerekmez · Otomatik yenileme yok
          </motion.p>
        </motion.div>

        {/* Phone mockup: müşterinin WhatsApp'ına gelen örnek bildirimler */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="absolute right-20 top-[50%] -translate-y-1/2 w-80 z-20 hidden lg:block">

          <div className="rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 relative h-[580px] flex flex-col" style={{ borderColor: "#2a2a2a", background: "#0a0a0a" }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#1a1a1a] rounded-b-xl z-30" />

            <div className="pt-7 pb-2 px-3 flex items-center gap-2.5 relative z-20 shadow-md flex-shrink-0" style={{ background: "#008069" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner flex-shrink-0"
                style={{ background: "var(--accent)", color: "#000" }}>✂</div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">BerberBot Bildirim</div>
                <div className="text-[10px] text-green-100 opacity-90">İşletme hesabı</div>
              </div>
            </div>

            <div className="px-2.5 py-2 flex flex-col gap-[6px] relative flex-1 overflow-hidden" style={{ background: "#efeae2" }}>
              <div className="self-center bg-[#e1f3fb] text-[#54656f] text-[10px] px-2.5 py-0.5 rounded-md mb-1 shadow-sm relative z-10 font-medium">BUGÜN</div>

              <motion.div
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.0 }}
                className="self-start max-w-[88%] px-2 py-1.5 rounded-lg text-[12px] shadow relative z-10 pb-[18px]"
                style={{ background: "#fff", color: "#111", borderTopLeftRadius: 0 }}>
                Merhaba Ahmet, <b>Usta Berber</b>&apos;deki <b>Saç Kesimi</b> randevunuz yarın <b>15:30</b> için onaylandı. ✅
                <br /><br />
                İptal etmek isterseniz:
                <br />
                <span className="text-[#027eb5] underline">berberbot.com/r/8f2a…</span>
                <span className="text-[9px] text-gray-400 absolute bottom-[3px] right-1.5">10:12</span>
              </motion.div>

              <div className="self-center bg-[#e1f3fb] text-[#54656f] text-[10px] px-2.5 py-0.5 rounded-md my-1 shadow-sm relative z-10 font-medium">YARIN</div>

              <motion.div
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.4 }}
                className="self-start max-w-[88%] px-2 py-1.5 rounded-lg text-[12px] shadow relative z-10 pb-[18px]"
                style={{ background: "#fff", color: "#111", borderTopLeftRadius: 0 }}>
                ⏰ Hatırlatma: Bugün saat <b>15:30</b>&apos;da <b>Usta Berber</b>&apos;de randevunuz var. Sizi bekliyoruz!
                <span className="text-[9px] text-gray-400 absolute bottom-[3px] right-1.5">12:30</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.8 }}
                className="max-w-[80%] px-2 py-1.5 rounded-lg text-[12px] shadow self-end relative z-10 pb-[18px]"
                style={{ background: "#d9fdd3", color: "#111", borderTopRightRadius: 0 }}>
                Teşekkürler, geliyorum 👍
                <div className="absolute bottom-[3px] right-1.5 flex items-center gap-0.5">
                  <span className="text-[9px] text-gray-500">12:31</span>
                  <CheckCheck size={12} className="text-[#53bdeb]" />
                </div>
              </motion.div>

              <div className="mt-auto self-center text-[10px] text-[#54656f] bg-white/70 rounded px-2 py-0.5 relative z-10">Örnek bildirimler</div>
            </div>

            <div className="bg-[#f0f2f5] px-2 py-1.5 flex items-center gap-1.5 flex-shrink-0 relative z-20">
              <div className="w-7 h-7 flex items-center justify-center text-gray-500"><Smile size={20} strokeWidth={1.5} /></div>
              <div className="flex-1 bg-white rounded-full h-8 px-3 flex items-center text-[12px] text-gray-400 shadow-sm">Mesaj yazın</div>
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-sm"><Mic size={16} /></div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -10, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -left-[220px] top-32 p-4 rounded-2xl shadow-2xl backdrop-blur-md border w-[240px] z-30 hidden xl:block"
            style={{ background: "rgba(20,20,20,0.95)", borderColor: "var(--accent)" }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex-shrink-0 bg-green-500/20 flex items-center justify-center text-green-500">
                <CheckCircle2 size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-white truncate">Yeni Randevu!</div>
                <div className="text-xs text-gray-400 truncate">Ahmet Y. · Saç Kesimi · 15:30</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 md:px-20 py-16 md:py-24 relative mt-10 md:mt-20 scroll-mt-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn} className="text-center mb-16">
          <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-7xl mb-6 tracking-tight">Neden BerberBot?</h2>
          <p className="text-xl font-light max-w-2xl mx-auto" style={{ color: "var(--text3)" }}>
            Siz sadece tıraşınıza odaklanın; randevu defterini, hatırlatmaları ve iptalleri BerberBot yönetsin.
          </p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {[
            { icon: <Link2 size={28} />, title: "Size Özel Randevu Sayfası", desc: "berberbot.com/dukkaniniz linkini Instagram biyografinize ekleyin. Müşteri hizmeti, personeli ve boş saati kendisi seçer; 7/24 randevu alır." },
            { icon: <CalendarDays size={28} />, title: "Çakışmasız Takvim", desc: "Hizmet süreleri, çalışma saatleri ve personel izinleri hesaba katılır. Dolu saatler otomatik kapanır, aynı saate iki randevu düşmez." },
            { icon: <BellRing size={28} />, title: "WhatsApp Onay & Hatırlatma", desc: `Randevu onaylandığında ve randevudan ${REMINDER_HOURS_BEFORE} saat önce müşteriye WhatsApp mesajı gider. Gelmeme (no-show) oranı düşer.` },
            { icon: <XCircle size={28} />, title: "Tek Tıkla İptal", desc: "Müşteri mesajdaki bağlantıdan randevusunu kendisi iptal eder; saat anında boşa çıkar ve size panelde bildirim düşer." },
            { icon: <QrCode size={28} />, title: "QR Kod Afişi", desc: "Hazır afişi yazdırıp aynaya veya tezgaha asın. Bekleyen müşteri kamerayla okutup bir sonraki randevusunu hemen alsın." },
            { icon: <TrendingUp size={28} />, title: "Gelir & Analiz", desc: "Aylık ciro, en çok tercih edilen hizmetler ve personel bazlı randevular tek ekranda, telefonunuzda." },
          ].map((f) => (
            <motion.div key={f.title} variants={fadeIn}
              className="p-8 rounded-2xl border transition-all hover:-translate-y-2 hover:shadow-[0_10px_40px_rgba(200,240,96,0.1)] group overflow-hidden relative"
              style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: "radial-gradient(circle at top right, rgba(200,240,96,0.05), transparent)" }} />
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3"
                style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                {f.icon}
              </div>
              <h3 className="font-heading font-bold text-2xl mb-3 text-white">{f.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--text3)" }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="px-6 md:px-20 py-16 md:py-24 relative scroll-mt-16">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeIn} className="text-center mb-16">
          <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tight">3 adımda hazır</h2>
          <p className="text-xl font-light max-w-2xl mx-auto" style={{ color: "var(--text3)" }}>Kurulum birkaç dakika sürer, teknik bilgi gerekmez.</p>
        </motion.div>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { icon: <Store size={26} />, step: "01", title: "Dükkanınızı kurun", desc: "Ücretsiz kaydolun; çalışma saatlerinizi, hizmetlerinizi (süre ve fiyatıyla) ve personelinizi girin." },
            { icon: <Share2 size={26} />, step: "02", title: "Linkinizi paylaşın", desc: "Randevu linkinizi Instagram, Google İşletme ve WhatsApp durumunuza ekleyin; QR afişini dükkana asın." },
            { icon: <MessageCircle size={26} />, step: "03", title: "Randevular gelsin", desc: "Müşteri randevu alır, onay ve hatırlatma WhatsApp'tan otomatik gider. Siz her şeyi panelden takip edersiniz." },
          ].map((s) => (
            <motion.div key={s.step} variants={fadeIn} className="p-8 rounded-2xl border relative" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>{s.icon}</div>
                <span className="font-heading font-black text-4xl opacity-20">{s.step}</span>
              </div>
              <h3 className="font-heading font-bold text-xl mb-2 text-white">{s.title}</h3>
              <p className="text-base leading-relaxed" style={{ color: "var(--text3)" }}>{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="px-6 md:px-20 py-16 md:py-24 text-center relative scroll-mt-16">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 50%)" }} />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={staggerContainer} className="relative z-10">
          <motion.div variants={fadeIn}>
            <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tight">Şeffaf Fiyatlandırma</h2>
            <p className="text-xl mb-8 font-light max-w-xl mx-auto" style={{ color: "var(--text3)" }}>
              Tek plan, tüm özellikler. Gizli ücret ve otomatik yenileme yok; yıllık planda ilk {YEARLY_REFUND_DAYS} gün koşulsuz iade.
            </p>

            <div className="inline-flex items-center gap-1 p-1 rounded-full mb-14 border" style={{ background: "var(--bg2)", borderColor: "var(--border)" }} role="group" aria-label="Faturalama periyodu">
              <button onClick={() => setYearly(false)} aria-pressed={!yearly}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all"
                style={!yearly ? { background: "var(--accent)", color: "#0a0a0a" } : { color: "var(--text2)" }}>
                Aylık
              </button>
              <button onClick={() => setYearly(true)} aria-pressed={yearly}
                className="px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2"
                style={yearly ? { background: "var(--accent)", color: "#0a0a0a" } : { color: "var(--text2)" }}>
                Yıllık
                <span className="text-[10px] px-2 py-0.5 rounded-full font-black" style={yearly ? { background: "#0a0a0a", color: "var(--accent)" } : { background: "var(--accent-dim2)", color: "var(--accent)" }}>2 AY BEDAVA</span>
              </button>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8 max-w-4xl mx-auto text-left">
            <motion.div variants={fadeIn}
              className="p-10 rounded-3xl border relative flex flex-col h-full shadow-[0_20px_50px_rgba(200,240,96,0.1)]"
              style={{ background: "rgba(20,20,20,0.9)", borderColor: "var(--accent)", backdropFilter: "blur(20px)" }}>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black font-heading shadow-lg whitespace-nowrap"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}>{TRIAL_DAYS} GÜN ÜCRETSİZ</div>

              <div className="text-sm font-bold uppercase tracking-widest mb-3 font-heading" style={{ color: "var(--accent)" }}>{PLANS.pro.name}</div>
              <div className="font-heading font-black text-6xl mb-2 tracking-tight text-white">
                ₺{price.toLocaleString("tr-TR")}
                <span className="text-lg font-normal" style={{ color: "var(--text3)" }}>{yearly ? "/yıl" : "/ay"}</span>
              </div>
              <div className="text-sm font-medium mb-2 min-h-[20px]" style={{ color: "var(--accent)" }}>
                {yearly
                  ? `Aylığa göre ₺${(PLANS.pro.price * 12 - PLANS.pro.yearlyPrice).toLocaleString("tr-TR")} tasarruf · ilk ${YEARLY_REFUND_DAYS} gün koşulsuz iade`
                  : "İstediğiniz ay bırakın, taahhüt yok"}
              </div>
              <div className="text-sm mb-8 pb-8 border-b" style={{ color: "var(--text3)", borderColor: "var(--border)" }}>
                Tek koltuklu berberden kalabalık salona, tüm işletmeler için. Fiyatlara vergiler dahildir.
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-10 flex-grow">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-3 font-medium" style={{ color: "var(--text2)" }}>
                    <CheckCircle2 size={18} style={{ color: "var(--accent)", flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <Link href="/signup"
                className="block text-center py-4 rounded-xl text-base font-bold transition-all hover:scale-[1.02]"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}>
                Ücretsiz Başla · Kart Gerekmez
              </Link>
            </motion.div>

            <motion.div variants={fadeIn}
              className="p-10 rounded-3xl border flex flex-col h-full"
              style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "var(--accent-dim)", color: "var(--accent)" }}>
                <Building2 size={24} />
              </div>
              <div className="text-sm font-bold uppercase tracking-widest mb-3 font-heading" style={{ color: "var(--text2)" }}>Birden fazla şube?</div>
              <p className="text-base mb-8 flex-grow leading-relaxed" style={{ color: "var(--text3)" }}>
                Zincir ve çok şubeli işletmeler için toplu kurulum ve özel fiyatlandırma konusunda bizimle görüşün.
              </p>
              <Link href="/iletisim"
                className="block text-center py-4 rounded-xl text-base font-bold transition-all hover:bg-white/10"
                style={{ background: "rgba(255,255,255,0.05)", color: "#fff" }}>
                İletişime Geçin
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="px-6 md:px-20 py-16 md:py-24 relative scroll-mt-16" style={{ background: "var(--bg)" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="max-w-4xl mx-auto">
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="font-heading font-black text-3xl md:text-5xl mb-6 tracking-tight">Sıkça Sorulan Sorular</h2>
            <p className="text-lg font-light" style={{ color: "var(--text3)" }}>Aklınıza takılan tüm detaylar burada.</p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {FAQS.map((faq) => (
              <motion.details key={faq.q} variants={fadeIn} className="group p-6 rounded-2xl border transition-all cursor-pointer"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                <summary className="font-heading font-bold text-lg text-white flex items-center justify-between gap-4 list-none">
                  {faq.q}
                  <span className="transition-transform group-open:rotate-45 text-2xl flex-shrink-0" style={{ color: "var(--accent)" }}>+</span>
                </summary>
                <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text2)" }}>{faq.a}</p>
              </motion.details>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="px-6 md:px-20 py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(135deg, var(--bg) 0%, #1a2408 100%)" }} />
        <div className="absolute -top-[50%] -right-[10%] w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none opacity-30"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }} />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={fadeIn}
          className="relative z-10 max-w-4xl mx-auto text-center border p-10 md:p-20 rounded-[3rem] shadow-[0_20px_60px_rgba(200,240,96,0.15)]"
          style={{ background: "rgba(20,20,20,0.6)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}>
          <h2 className="font-heading font-black text-4xl md:text-6xl mb-6 tracking-tight text-white">
            Dükkanınızı <span style={{ color: "var(--accent)" }}>Geleceğe</span> Taşıyın
          </h2>
          <p className="text-xl mb-10 font-light max-w-2xl mx-auto" style={{ color: "var(--text3)" }}>
            Bugün kurun, bu akşam ilk online randevunuzu alın.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link href="/signup" className="px-10 py-5 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-[0_0_30px_rgba(200,240,96,0.3)] w-full sm:w-auto"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Ücretsiz Başla
            </Link>
            <Link href="/iletisim" className="px-10 py-5 rounded-2xl text-lg font-medium border transition-colors hover:bg-white/5 w-full sm:w-auto"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              Bizimle İletişime Geç
            </Link>
          </div>
          <p className="mt-8 text-sm" style={{ color: "var(--text3)" }}>Kredi kartı gerekmez. {TRIAL_DAYS} gün ücretsiz deneme.</p>
        </motion.div>
      </section>

      <div className="mt-20">
        <SiteFooter />
      </div>
    </div>
  );
}
