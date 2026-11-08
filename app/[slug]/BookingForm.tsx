"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { createBooking, getAvailableSlots } from "./actions";
import { bookingSchema } from "@/lib/validations";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface StaffOption {
  id: string;
  name: string;
}

interface Props {
  shop: { id: string; name: string };
  services: Service[];
  staffList: StaffOption[];
  /** Türkiye saatine göre seçilebilir günler, "YYYY-MM-DD" */
  bookableDates: string[];
}

export default function BookingForm({ shop, services, staffList, bookableDates }: Props) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const [slots, setSlots] = useState<string[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [dayClosed, setDayClosed] = useState(false);
  const [isStaffOnLeave, setIsStaffOnLeave] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [privacyAccepted, setPrivacyAccepted] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<"pending" | "confirmed" | null>(null);

  const hasStaff = staffList.length > 0;
  const stepTitles = hasStaff ? ["Hizmet", "Personel", "Zaman", "Bilgiler"] : ["Hizmet", "Zaman", "Bilgiler"];

  const STAFF_STEP = hasStaff ? 2 : -1;
  const DATE_STEP = hasStaff ? 3 : 2;
  const INFO_STEP = hasStaff ? 4 : 3;

  useEffect(() => {
    if (!selectedDate || !selectedService) {
      setSlots([]);
      setDayClosed(false);
      setIsStaffOnLeave(false);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);
    getAvailableSlots({
      shopId: shop.id,
      serviceId: selectedService.id,
      date: selectedDate,
      staffId: selectedStaffId,
    })
      .then((res) => {
        if (cancelled) return;
        setSlots(res.slots);
        setDayClosed(res.closed);
        setIsStaffOnLeave(res.staffOnLeave);
      })
      .catch(() => {
        if (cancelled) return;
        setSlots([]);
        setError("Müsait saatler yüklenemedi. Lütfen sayfayı yenileyin.");
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, selectedStaffId, selectedService, shop.id]);

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime) {
      setError("Lütfen hizmet, tarih ve saat seçin.");
      return;
    }

    const validation = bookingSchema.safeParse({ customerName, phone: customerPhone });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      return;
    }
    if (!privacyAccepted) {
      setError("Devam etmek için Aydınlatma Metni'ni okuduğunuzu onaylayın.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createBooking({
        shopId: shop.id,
        serviceId: selectedService.id,
        staffId: selectedStaffId,
        customerName,
        customerPhone,
        date: selectedDate,
        time: selectedTime,
        privacyAccepted,
      });

      if (res.success) {
        setResult(res.status);
      } else {
        setError(res.error);
        // Saat dolduysa kullanıcıyı saat seçimine geri götür
        if (res.code === "slot_taken") {
          setSelectedTime(null);
          setStep(DATE_STEP);
          const refreshed = await getAvailableSlots({
            shopId: shop.id,
            serviceId: selectedService.id,
            date: selectedDate,
            staffId: selectedStaffId,
          });
          setSlots(refreshed.slots);
        }
      }
    } catch {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  const formatDateLabel = (date: string, pattern: string) => format(parseISO(date), pattern, { locale: tr });

  if (result) {
    return (
      <div className="p-10 rounded-3xl border text-center" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-500/20 text-green-500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-heading mb-3">
          {result === "confirmed" ? "Randevunuz Oluşturuldu!" : "Randevu Talebiniz Alındı!"}
        </h2>
        <p className="mb-2" style={{ color: "var(--text2)" }}>
          {selectedService?.name} · {selectedDate && formatDateLabel(selectedDate, "d MMMM yyyy, EEEE")} · {selectedTime}
        </p>
        <p className="mb-6 text-sm" style={{ color: "var(--text3)" }}>
          {result === "confirmed"
            ? "Randevu bilgileriniz ve iptal bağlantınız WhatsApp üzerinden gönderilecek."
            : `${shop.name} talebinizi onayladığında WhatsApp üzerinden bilgilendirileceksiniz.`}
        </p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 rounded-xl font-bold text-sm" style={{ background: "var(--bg3)", color: "var(--text)" }}>
          Yeni Randevu Al
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border overflow-hidden" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
      {/* Progress */}
      <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
        {stepTitles.map((title, i) => {
          const num = i + 1;
          return (
            <div key={num} className="flex-1 py-4 text-center text-[10px] sm:text-xs font-bold uppercase tracking-widest relative"
              style={{
                color: step >= num ? "var(--text)" : "var(--text3)",
                background: step === num ? "rgba(255,255,255,0.02)" : "transparent",
              }}>
              <span className="opacity-50 mr-1">0{num}</span> {title}
              {step >= num && <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ background: "var(--accent)" }} />}
            </div>
          );
        })}
      </div>

      <div className="p-5 sm:p-8">
        {error && (
          <div role="alert" className="p-4 mb-6 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: SERVICE */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold mb-6">Ne yaptırmak istersiniz?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => {
                    setSelectedService(service);
                    setSelectedTime(null);
                    setError(null);
                    setStep(hasStaff ? STAFF_STEP : DATE_STEP);
                  }}
                  className="p-5 text-left rounded-2xl border transition-all hover:-translate-y-1"
                  style={{
                    background: selectedService?.id === service.id ? "var(--accent-dim)" : "var(--bg3)",
                    borderColor: selectedService?.id === service.id ? "var(--accent)" : "var(--border)",
                  }}
                >
                  <div className="font-bold text-lg mb-1">{service.name}</div>
                  <div className="text-sm font-medium flex items-center justify-between" style={{ color: "var(--text2)" }}>
                    <span>{service.duration_minutes} dk</span>
                    <span className="font-bold" style={{ color: "var(--text)" }}>{Number(service.price).toLocaleString("tr-TR")} ₺</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: STAFF */}
        {step === STAFF_STEP && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Personel Seçimi</h2>
              <button onClick={() => setStep(1)} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Geri</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setSelectedStaffId(null); setSelectedTime(null); setStep(DATE_STEP); }}
                className="p-5 text-left rounded-2xl border transition-all hover:-translate-y-1 flex items-center gap-3"
                style={{
                  background: selectedStaffId === null ? "var(--accent-dim)" : "var(--bg3)",
                  borderColor: selectedStaffId === null ? "var(--accent)" : "var(--border)",
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: "var(--bg2)", color: "var(--text)" }}>?</div>
                <div className="font-bold text-lg">Fark Etmez</div>
              </button>
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => { setSelectedStaffId(staff.id); setSelectedTime(null); setStep(DATE_STEP); }}
                  className="p-5 text-left rounded-2xl border transition-all hover:-translate-y-1 flex items-center gap-3"
                  style={{
                    background: selectedStaffId === staff.id ? "var(--accent-dim)" : "var(--bg3)",
                    borderColor: selectedStaffId === staff.id ? "var(--accent)" : "var(--border)",
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: "var(--bg2)", color: "var(--accent)" }}>{staff.name.charAt(0).toUpperCase()}</div>
                  <div className="font-bold text-lg">{staff.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: DATE & TIME */}
        {step === DATE_STEP && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Uygun Bir Zaman Seçin</h2>
              <button onClick={() => setStep(hasStaff ? STAFF_STEP : 1)} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Geri</button>
            </div>

            <div className="mb-6">
              <div className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Gün</div>
              <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                {bookableDates.map((date) => {
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); setError(null); }}
                      className="min-w-[72px] p-3 rounded-2xl border text-center transition-all shrink-0"
                      style={{
                        background: isSelected ? "var(--accent)" : "var(--bg3)",
                        borderColor: isSelected ? "var(--accent)" : "var(--border)",
                        color: isSelected ? "#0a0a0a" : "var(--text)",
                      }}
                    >
                      <div className="text-xs font-bold uppercase mb-1 opacity-60">{formatDateLabel(date, "EEE")}</div>
                      <div className="text-xl font-black font-heading">{formatDateLabel(date, "d")}</div>
                      <div className="text-[10px] font-medium opacity-60">{formatDateLabel(date, "MMM")}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <div className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Saat</div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {slotsLoading ? (
                    <div className="col-span-3 sm:col-span-6 text-sm py-4 text-center" style={{ color: "var(--text3)" }}>
                      Müsait saatler yükleniyor...
                    </div>
                  ) : isStaffOnLeave ? (
                    <div className="col-span-3 sm:col-span-6 p-4 rounded-xl text-sm font-medium border text-center"
                      style={{ background: "rgba(255,165,0,0.1)", borderColor: "rgba(255,165,0,0.3)", color: "#ffb74d" }}>
                      ⚠️ Seçtiğiniz personel bu tarihte izinlidir. Lütfen başka bir gün seçin veya geri dönüp farklı bir personel tercih edin.
                    </div>
                  ) : dayClosed ? (
                    <div className="col-span-3 sm:col-span-6 text-sm py-4 text-center" style={{ color: "var(--text3)" }}>
                      İşletme bu gün kapalı. Lütfen başka bir gün seçin.
                    </div>
                  ) : slots.length > 0 ? (
                    slots.map((time) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className="p-3 rounded-xl border text-sm font-bold transition-all"
                          style={{
                            background: isSelected ? "var(--text)" : "transparent",
                            borderColor: isSelected ? "var(--text)" : "var(--border)",
                            color: isSelected ? "var(--bg)" : "var(--text)",
                          }}
                        >
                          {time}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-3 sm:col-span-6 text-sm py-4 text-center" style={{ color: "var(--text3)" }}>
                      Bu gün için uygun randevu saati bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTime && (
              <button
                onClick={() => { setError(null); setStep(INFO_STEP); }}
                className="w-full mt-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}
              >
                Devam Et
              </button>
            )}
          </div>
        )}

        {/* STEP: CUSTOMER INFO */}
        {step === INFO_STEP && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Kişisel Bilgileriniz</h2>
              <button onClick={() => setStep(DATE_STEP)} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Geri</button>
            </div>

            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label htmlFor="booking-name" className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
                  Adınız Soyadınız
                </label>
                <input
                  id="booking-name"
                  type="text"
                  required
                  autoComplete="name"
                  maxLength={80}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none transition-colors"
                  style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label htmlFor="booking-phone" className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
                  Cep Telefonunuz (WhatsApp)
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  required
                  autoComplete="tel"
                  inputMode="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="532 123 45 67"
                  className="w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none transition-colors"
                  style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                />
                <p className="text-xs mt-2" style={{ color: "var(--text3)" }}>
                  Randevu onayı, hatırlatması ve iptal bağlantısı bu numaraya WhatsApp ile gönderilir.
                </p>
              </div>

              <div className="p-4 rounded-xl border mt-6" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                <div className="text-sm font-bold mb-2">Randevu Özeti</div>
                <div className="text-sm flex justify-between gap-3 mb-1" style={{ color: "var(--text2)" }}>
                  <span>Hizmet:</span>
                  <span className="font-medium text-white text-right">{selectedService?.name} ({selectedService?.duration_minutes} dk)</span>
                </div>
                {hasStaff && (
                  <div className="text-sm flex justify-between gap-3 mb-1" style={{ color: "var(--text2)" }}>
                    <span>Personel:</span>
                    <span className="font-medium text-white text-right">{selectedStaffId ? staffList.find((s) => s.id === selectedStaffId)?.name : "Fark Etmez"}</span>
                  </div>
                )}
                <div className="text-sm flex justify-between gap-3 mb-1" style={{ color: "var(--text2)" }}>
                  <span>Tarih & Saat:</span>
                  <span className="font-medium text-white text-right">
                    {selectedDate && formatDateLabel(selectedDate, "d MMMM yyyy")} - {selectedTime}
                  </span>
                </div>
                {selectedService && (
                  <div className="text-sm flex justify-between gap-3" style={{ color: "var(--text2)" }}>
                    <span>Ücret:</span>
                    <span className="font-medium text-white">{Number(selectedService.price).toLocaleString("tr-TR")} ₺</span>
                  </div>
                )}
              </div>

              <label className="flex items-start gap-3 text-xs leading-relaxed cursor-pointer" style={{ color: "var(--text2)" }}>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 flex-shrink-0 accent-[var(--accent)]"
                />
                <span>
                  Randevumun oluşturulması ve WhatsApp ile bilgilendirilmem amacıyla ad ve telefon bilgilerimin işlenmesine ilişkin{" "}
                  <Link href="/aydinlatma-metni" target="_blank" className="underline" style={{ color: "var(--accent)" }}>
                    Aydınlatma Metni
                  </Link>
                  &apos;ni okudum.
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5 mt-4"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}
              >
                {loading ? "Gönderiliyor..." : "Randevuyu Oluştur"}
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
