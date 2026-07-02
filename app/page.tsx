"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, CalendarDays, BellRing, TrendingUp, Zap, Globe, ArrowRight, CheckCircle2, Smile, Mic, CheckCheck, Menu, X } from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fadeIn = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  return (
    <div className="min-h-screen overflow-hidden" style={{ background: "var(--bg)", color: "var(--text)" }}>
      {/* ── NAV ── */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ borderBottom: "1px solid var(--border)", background: "rgba(10,10,10,0.8)" }}
        className="fixed top-0 left-0 right-0 h-16 flex items-center px-4 md:px-12 gap-5 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base font-bold shadow-[0_0_15px_rgba(200,240,96,0.3)]"
            style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
          <span className="font-heading font-black text-xl tracking-tight">BerberBot</span>
        </div>
        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-7 ml-auto">
          <a href="#features" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "var(--text3)" }}>Özellikler</a>
          <a href="#pricing" className="text-sm font-medium hover:text-white transition-colors" style={{ color: "var(--text3)" }}>Fiyatlar</a>
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
        {/* Mobile Hamburger */}
        <button className="md:hidden ml-auto p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 p-6 flex flex-col gap-4 border-b md:hidden"
            style={{ background: "rgba(10,10,10,0.95)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}>
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-2" style={{ color: "var(--text2)" }}>Özellikler</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-base font-medium py-2" style={{ color: "var(--text2)" }}>Fiyatlar</a>
            <Link href="/login" className="text-base font-medium py-2" style={{ color: "var(--text2)" }}>Giriş Yap</Link>
            <Link href="/signup" className="text-center py-3 rounded-xl font-bold" style={{ background: "var(--accent)", color: "#0a0a0a" }}>Ücretsiz Dene</Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section className="min-h-screen flex items-center px-6 md:px-20 pt-24 pb-16 relative">
        {/* Static Background Elements (Kasma olmaması için animasyon kaldırıldı) */}
        <div
          className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full blur-[100px] pointer-events-none opacity-40"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.15) 0%, transparent 70%)" }}
        />
        <div
          className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, rgba(200,240,96,0.1) 0%, transparent 70%)" }}
        />

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.2 }}
          variants={staggerContainer}
          className="max-w-2xl relative z-10">

          <motion.div variants={fadeIn}
            className="inline-flex items-center gap-3 px-4 py-2 rounded-full text-xs font-bold mb-8 shadow-[0_0_15px_rgba(200,240,96,0.15)]"
            style={{ background: "var(--accent-dim)", border: "1px solid var(--accent-dim2)", color: "var(--accent)" }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "var(--accent)" }}></span>
              <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "var(--accent)" }}></span>
            </span>
            WhatsApp 7/24 Aktif Asistan
          </motion.div>

          <motion.h1 variants={fadeIn}
            className="font-heading font-black text-5xl md:text-6xl lg:text-8xl leading-[1.1] tracking-tighter mb-6">
            Berberlik<br />değil<br />
            <span style={{ color: "var(--accent)", textShadow: "0 0 40px rgba(200,240,96,0.3)" }}>Teknoloji</span><br />
            sürüyor.
          </motion.h1>

          <motion.p variants={fadeIn}
            className="text-base md:text-xl mb-10 leading-relaxed font-light max-w-lg" style={{ color: "var(--text2)" }}>
            Müşterileriniz WhatsApp üzerinden randevu alırken siz işinize odaklanın. Otomatik hatırlatmalar, akıllı takvim ve sıfır telefon trafiği.
          </motion.p>

          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Link href="/signup" className="px-8 py-4 rounded-xl text-lg font-bold transition-all hover:scale-105 flex items-center gap-2 shadow-[0_0_30px_rgba(200,240,96,0.25)]"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Hemen Başla <ArrowRight size={20} />
            </Link>
            <button className="px-8 py-4 rounded-xl text-lg font-medium border transition-colors hover:bg-white/5 flex items-center gap-2"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              Demo İzle
            </button>
          </motion.div>
        </motion.div>

        {/* Animated Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          className="absolute right-20 top-[50%] -translate-y-1/2 w-80 z-20 hidden lg:block">

          {/* Phone Body */}
          <div className="rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-4 relative h-[580px] flex flex-col" style={{ borderColor: "#2a2a2a", background: "#0a0a0a" }}>
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-5 bg-[#1a1a1a] rounded-b-xl z-30" />

            {/* WhatsApp Header */}
            <div className="pt-7 pb-2 px-3 flex items-center gap-2.5 relative z-20 shadow-md flex-shrink-0" style={{ background: "#008069" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-inner flex-shrink-0"
                style={{ background: "var(--accent)", color: "#000" }}>✂</div>
              <div>
                <div className="text-xs font-bold text-white leading-tight">Maestro Berber</div>
                <div className="text-[10px] text-green-100 opacity-90">çevrimiçi</div>
              </div>
            </div>

            {/* WhatsApp Chat Area */}
            <div className="px-2.5 py-2 flex flex-col gap-[6px] relative flex-1 overflow-hidden" style={{ background: "#efeae2" }}>
              {/* WhatsApp Background Pattern */}
              <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '200px', backgroundRepeat: 'repeat' }} />
              
              {/* Date Badge */}
              <div className="self-center bg-[#e1f3fb] text-[#54656f] text-[10px] px-2.5 py-0.5 rounded-md mb-1 shadow-sm relative z-10 font-medium">BUGÜN</div>

              {/* Customer: "Randevu almak istiyorum" */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}
                className="max-w-[80%] px-2 py-1.5 rounded-lg text-[12px] shadow self-end relative z-10 pb-[18px]"
                style={{ background: "#d9fdd3", color: "#111", borderTopRightRadius: 0 }}>
                İyi günler, saç kesimi için randevu almak istiyorum 👋
                <div className="absolute bottom-[3px] right-1.5 flex items-center gap-0.5">
                  <span className="text-[9px] text-gray-500">15:28</span>
                  <CheckCheck size={12} className="text-[#53bdeb]" />
                </div>
              </motion.div>
              
              {/* Bot: Hizmet seçenekleri */}
              <motion.div 
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.2 }}
                className="flex items-end gap-1.5 self-start max-w-[82%] relative z-10">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shadow flex-shrink-0 mb-0.5" style={{ background: "var(--accent)", color: "#000" }}>
                  <span className="text-[9px]">✂</span>
                </div>
                <div className="px-2 py-1.5 rounded-lg text-[12px] shadow relative pb-[18px]"
                  style={{ background: "#fff", color: "#111", borderTopLeftRadius: 0 }}>
                  Hoş geldiniz! Hangi hizmeti almak istiyorsunuz?
                  <br /><br />
                  1. Saç Kesimi (150 TL)<br />
                  2. Sakal (80 TL)
                  <span className="text-[9px] text-gray-400 absolute bottom-[3px] right-1.5">15:28</span>
                </div>
              </motion.div>
              
              {/* Customer: "1" */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.5 }}
                className="max-w-[80%] px-2 py-1.5 rounded-lg text-[12px] shadow self-end relative z-10 pb-[18px]"
                style={{ background: "#d9fdd3", color: "#111", borderTopRightRadius: 0 }}>
                1
                <div className="absolute bottom-[3px] right-1.5 flex items-center gap-0.5">
                  <span className="text-[9px] text-gray-500">15:29</span>
                  <CheckCheck size={12} className="text-[#53bdeb]" />
                </div>
              </motion.div>
              
              {/* Bot: Uygun saatler */}
              <motion.div 
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 4.8 }}
                className="flex items-end gap-1.5 self-start max-w-[82%] relative z-10">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shadow flex-shrink-0 mb-0.5" style={{ background: "var(--accent)", color: "#000" }}>
                  <span className="text-[9px]">✂</span>
                </div>
                <div className="px-2 py-1.5 rounded-lg text-[12px] shadow relative pb-[18px]"
                  style={{ background: "#fff", color: "#111", borderTopLeftRadius: 0 }}>
                  Yarın için uygun saatler:
                  <br /><br />
                  14:00 | 15:30 | 17:00
                  <span className="text-[9px] text-gray-400 absolute bottom-[3px] right-1.5">15:29</span>
                </div>
              </motion.div>
              
              {/* Customer: "15:30" */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 6.0 }}
                className="max-w-[80%] px-2 py-1.5 rounded-lg text-[12px] shadow self-end relative z-10 pb-[18px]"
                style={{ background: "#d9fdd3", color: "#111", borderTopRightRadius: 0 }}>
                15:30
                <div className="absolute bottom-[3px] right-1.5 flex items-center gap-0.5">
                  <span className="text-[9px] text-gray-500">15:30</span>
                  <CheckCheck size={12} className="text-[#53bdeb]" />
                </div>
              </motion.div>

              {/* Bot: Randevu onayı */}
              <motion.div 
                initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 7.2 }}
                className="flex items-end gap-1.5 self-start max-w-[82%] relative z-10">
                <div className="w-5 h-5 rounded-full flex items-center justify-center shadow flex-shrink-0 mb-0.5" style={{ background: "var(--accent)", color: "#000" }}>
                  <span className="text-[9px]">✂</span>
                </div>
                <div className="px-2 py-1.5 rounded-lg text-[12px] shadow relative pb-[18px]"
                  style={{ background: "#fff", color: "#111", borderTopLeftRadius: 0 }}>
                  ✅ Yarın 15:30 için Saç Kesimi randevunuz oluşturuldu. Bekliyoruz!
                  <span className="text-[9px] text-gray-400 absolute bottom-[3px] right-1.5">15:30</span>
                </div>
              </motion.div>
            </div>

            {/* WhatsApp Input Bar */}
            <div className="bg-[#f0f2f5] px-2 py-1.5 flex items-center gap-1.5 flex-shrink-0 relative z-20">
              <div className="w-7 h-7 flex items-center justify-center text-gray-500"><Smile size={20} strokeWidth={1.5} /></div>
              <div className="flex-1 bg-white rounded-full h-8 px-3 flex items-center text-[12px] text-gray-400 shadow-sm">Mesaj yazın</div>
              <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white shadow-sm"><Mic size={16} /></div>
            </div>
          </div>

          {/* Floating UI Elements */}
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
                <div className="text-xs text-gray-400 truncate">Ahmet Y. - 15:30</div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="px-6 md:px-20 py-16 md:py-24 relative mt-10 md:mt-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={fadeIn}
          className="text-center mb-16">
          <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-7xl mb-6 tracking-tight">Neden BerberBot?</h2>
          <p className="text-xl font-light max-w-2xl mx-auto" style={{ color: "var(--text3)" }}>
            Siz sadece tıraşınıza odaklanın, randevu defterini yapay zeka yönetsin.
          </p>
        </motion.div>

        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {[
            { icon: <MessageCircle size={28} />, title: "Akıllı Bot Akışı", desc: "Müşteri doğal dilde yazıyor, bot hizmeti ve saati otomatik anlıyor. Siz hiçbir şeye dokunmuyorsunuz." },
            { icon: <CalendarDays size={28} />, title: "Gerçek Zamanlı Takvim", desc: "Günlük/haftalık randevu görünümü. Çakışma imkânsız — bot dolu saatleri otomatik atlıyor." },
            { icon: <BellRing size={28} />, title: "Otomatik Hatırlatma", desc: "Randevudan önce müşteriye WhatsApp mesajı atarak gelmeme (no-show) oranını düşürür." },
            { icon: <TrendingUp size={28} />, title: "Gelir & Analiz Takibi", desc: "Aylık ciro, en çok tercih edilen hizmetler, müşteri sıklığı. Her şey tek ekranda, elinizin altında." },
            { icon: <Zap size={28} />, title: "5 Dakikada Kurulum", desc: "QR kodu okutun, hizmetlerinizi girin ve arkanıza yaslanın. Hiçbir teknik bilgi gerektirmez." },
            { icon: <Globe size={28} />, title: "Türkçe & Yerli Altyapı", desc: "Türkiye pazarına özel geliştirilmiş, yerel dil asistanı ve 7/24 kesintisiz yerel destek ekibi." },
          ].map((f, i) => (
            <motion.div key={i} variants={fadeIn}
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

      {/* ── PRICING ── */}
      <section id="pricing" className="px-6 md:px-20 py-16 md:py-24 text-center relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full blur-[150px] pointer-events-none opacity-20"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 50%)" }} />

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={staggerContainer} className="relative z-10">
          <motion.div variants={fadeIn}>
            <h2 className="font-heading font-black text-4xl md:text-5xl lg:text-6xl mb-6 tracking-tight">Şeffaf Fiyatlandırma</h2>
            <p className="text-xl mb-16 font-light max-w-xl mx-auto" style={{ color: "var(--text3)" }}>Gizli ücret, sürpriz kesinti yok. Memnun kalmazsanız anında iptal edebilirsiniz.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto text-left">
            {[
              { plan: "Başlangıç", price: "₺199", desc: "Tek koltuklu berberler ve yeni başlayanlar için", features: ["Aylık 200 randevu", "WhatsApp Bot (Standart)", "Admin Panel", "Hatırlatma mesajları"], popular: false },
              { plan: "Profesyonel", price: "₺349", desc: "Büyüyen ve yoğun çalışan profesyonel salonlar", features: ["Sınırsız randevu", "Çoklu çalışan profili", "Gelir & Analitik raporları", "Gelişmiş WhatsApp Akışı", "Öncelikli Destek"], popular: true },
              { plan: "Franchise", price: "₺799", desc: "Birden fazla şubesi olan zincir markalar için", features: ["Sınırsız şube & çalışan", "Merkezi yönetim paneli", "Özel bot kişiselleştirme", "API erişimi", "VIP Destek & Kurulum"], popular: false },
            ].map((p, i) => (
              <motion.div key={p.plan} variants={fadeIn}
                className={`p-10 rounded-3xl border transition-all hover:-translate-y-2 relative flex flex-col h-full ${p.popular ? 'shadow-[0_20px_50px_rgba(200,240,96,0.1)]' : ''}`}
                style={{
                  background: p.popular ? "rgba(20,20,20,0.9)" : "var(--bg2)",
                  borderColor: p.popular ? "var(--accent)" : "var(--border)",
                  backdropFilter: "blur(20px)"
                }}>
                {p.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-black font-heading shadow-lg"
                    style={{ background: "var(--accent)", color: "#0a0a0a" }}>EN ÇOK TERCİH EDİLEN</div>
                )}

                <div className="text-sm font-bold uppercase tracking-widest mb-3 font-heading" style={{ color: "var(--accent)" }}>{p.plan}</div>
                <div className="font-heading font-black text-6xl mb-2 tracking-tight text-white">{p.price}<span className="text-lg font-normal" style={{ color: "var(--text3)" }}>/ay</span></div>
                <div className="text-sm mb-8 pb-8 border-b" style={{ color: "var(--text3)", borderColor: "var(--border)" }}>{p.desc}</div>

                <ul className="flex flex-col gap-4 mb-10 flex-grow">
                  {p.features.map((f) => (
                    <li key={f} className="text-base flex items-start gap-3 font-medium" style={{ color: "var(--text2)" }}>
                      <CheckCircle2 size={20} style={{ color: "var(--accent)", flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link href="/signup"
                  className="block text-center py-4 rounded-xl text-base font-bold transition-all hover:scale-105"
                  style={p.popular ? { background: "var(--accent)", color: "#0a0a0a" } : { background: "rgba(255,255,255,0.05)", color: "#fff" }}>
                  {p.popular ? "Hemen Ücretsiz Başla" : "Planı Seç"}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FAQ (Sıkça Sorulan Sorular) ── */}
      <section id="faq" className="px-6 md:px-20 py-16 md:py-24 relative" style={{ background: "var(--bg)" }}>
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={staggerContainer} className="max-w-4xl mx-auto">
          <motion.div variants={fadeIn} className="text-center mb-16">
            <h2 className="font-heading font-black text-3xl md:text-5xl mb-6 tracking-tight">Sıkça Sorulan Sorular</h2>
            <p className="text-lg font-light" style={{ color: "var(--text3)" }}>Aklınıza takılan tüm detaylar burada.</p>
          </motion.div>

          <div className="flex flex-col gap-4">
            {[
              { q: "Müşterilerim WhatsApp'tan nasıl randevu alacak?", a: "Müşterileriniz dükkanınıza ait numaraya sadece 'Randevu' yazarak süreci başlatabilir. Bot, uygun hizmetleri ve boş saatleri listeleyip yönlendirmelerle kaydı tamamlar." },
              { q: "BerberBot'u kullanmak için teknik bir bilgiye ihtiyacım var mı?", a: "Hayır, hiçbir teknik bilgiye ihtiyacınız yok. Sisteme kaydolduktan sonra panelde karşınıza çıkan QR kodu kendi WhatsApp'ınızdan okutmanız yeterli." },
              { q: "Kendi WhatsApp numaramı kullanabilir miyim?", a: "Kesinlikle evet! Müşterilerinizin halihazırda bildiği dükkan numaranızı veya kişisel numaranızı doğrudan BerberBot'a bağlayıp kullanabilirsiniz." },
              { q: "Randevuları nereden takip edeceğim?", a: "Size özel gelişmiş Yönetim Paneli (Dashboard) üzerinden tüm randevularınızı, günlük akışınızı ve müşteri istatistiklerinizi anlık olarak akıllı telefonunuzdan veya bilgisayardan takip edebilirsiniz." },
              { q: "Memnun kalmazsam iptal edebilir miyim?", a: "Evet, hiçbir taahhüt bulunmamaktadır. Aboneliğinizi istediğiniz zaman tek tıkla iptal edebilir ve bot kullanımını sonlandırabilirsiniz." }
            ].map((faq, i) => (
              <motion.details key={i} variants={fadeIn} className="group p-6 rounded-2xl border transition-all cursor-pointer"
                style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
                <summary className="font-heading font-bold text-lg text-white flex items-center justify-between list-none">
                  {faq.q}
                  <span className="transition-transform group-open:rotate-45 text-2xl" style={{ color: "var(--accent)" }}>+</span>
                </summary>
                <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--text2)" }}>
                  {faq.a}
                </p>
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
        
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.5 }} variants={fadeIn} 
          className="relative z-10 max-w-4xl mx-auto text-center border p-12 md:p-20 rounded-[3rem] shadow-[0_20px_60px_rgba(200,240,96,0.15)]"
          style={{ background: "rgba(20,20,20,0.6)", borderColor: "var(--border)", backdropFilter: "blur(20px)" }}>
          
          <h2 className="font-heading font-black text-4xl md:text-6xl mb-6 tracking-tight text-white">
            Dükkanınızı <span style={{ color: "var(--accent)" }}>Geleceğe</span> Taşıyın
          </h2>
          <p className="text-xl mb-10 font-light max-w-2xl mx-auto" style={{ color: "var(--text3)" }}>
            Siz sadece mükemmel tıraşlara odaklanın, randevu defterini, hatırlatmaları ve müşteri asistanlığını yapay zeka yönetsin.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-5">
            <Link href="/signup" className="px-10 py-5 rounded-2xl text-lg font-bold transition-all hover:scale-105 shadow-[0_0_30px_rgba(200,240,96,0.3)] w-full sm:w-auto"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>
              Ücretsiz Başla
            </Link>
            <Link href="/iletişim" className="px-10 py-5 rounded-2xl text-lg font-medium border transition-colors hover:bg-white/5 w-full sm:w-auto"
              style={{ borderColor: "var(--border2)", color: "var(--text2)" }}>
              Bizimle İletişime Geç
            </Link>
          </div>
          
          <p className="mt-8 text-sm" style={{ color: "var(--text3)" }}>Kredi kartı gerekmez. 14 gün ücretsiz deneme.</p>
        </motion.div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="px-6 md:px-20 py-12 border-t mt-20" style={{ borderColor: "var(--border)", background: "var(--bg2)" }}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6 md:justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--accent)", color: "#0a0a0a" }}>✂</div>
            <span className="font-heading font-bold text-lg text-white">BerberBot</span>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-sm font-medium" style={{ color: "var(--text3)" }}>
            <Link href="/gizlilik" className="hover:text-white transition-colors">Gizlilik Politikası</Link>
            <Link href="/kullanim-kosullari" className="hover:text-white transition-colors">Kullanım Koşulları</Link>
            <a href="mailto:destek@berberbot.com" className="hover:text-white transition-colors">İletişim</a>
          </div>
          <div className="text-sm" style={{ color: "var(--text3)" }}>
            © 2025 BerberBot SaaS.
          </div>
        </div>
      </footer>
    </div>
  );
}
