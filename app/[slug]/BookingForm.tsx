"use client";

import { useState, useEffect } from "react";
import { createBooking, getBookedSlots } from "./actions";
import { format, addDays, startOfToday, parse, isBefore, addMinutes, isAfter, isEqual } from "date-fns";
import { tr } from "date-fns/locale";
import { bookingSchema } from "@/lib/validations";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export default function BookingForm({ shop, services, settings, staffList }: any) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [isStaffOnLeave, setIsStaffOnLeave] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hasStaff = staffList && staffList.length > 0;
  const stepTitles = hasStaff 
    ? ["Hizmet", "Personel", "Zaman", "Bilgiler"] 
    : ["Hizmet", "Zaman", "Bilgiler"];

  const STAFF_STEP = hasStaff ? 2 : -1;
  const DATE_STEP = hasStaff ? 3 : 2;
  const INFO_STEP = hasStaff ? 4 : 3;

  useEffect(() => {
    if (selectedDate) {
      getBookedSlots(shop.id, selectedDate.toISOString(), selectedStaffId).then((res) => {
        setBookedSlots(res.bookedSlots);
        setIsStaffOnLeave(res.isStaffOnLeave || false);
      });
    } else {
      setBookedSlots([]);
      setIsStaffOnLeave(false);
    }
  }, [selectedDate, selectedStaffId, shop.id]);

  // Generate next 14 days
  const today = startOfToday();
  const availableDates = Array.from({ length: 14 }).map((_, i) => addDays(today, i));

  // Get available times for selected date
  const getAvailableTimes = () => {
    if (!selectedDate || !selectedService) return [];
    
    const dayOfWeek = selectedDate.getDay();
    const dayConfig = settings.working_hours?.find((d: any) => d.day === dayOfWeek);
    
    if (!dayConfig || !dayConfig.is_open) return [];

    const startTime = parse(dayConfig.start, "HH:mm", selectedDate);
    const endTime = parse(dayConfig.end, "HH:mm", selectedDate);
    const now = new Date();

    const slots = [];
    let currentSlot = startTime;

    while (isBefore(currentSlot, endTime) || isEqual(currentSlot, endTime)) {
      const slotEnd = addMinutes(currentSlot, selectedService.duration_minutes);
      
      // Don't add slots that exceed closing time
      if (isAfter(slotEnd, endTime)) break;
      
      const timeStr = format(currentSlot, "HH:mm");
      // If it's today, only show future times
      if (isAfter(currentSlot, now) || !isEqual(selectedDate, today)) {
        if (!bookedSlots.includes(timeStr)) {
          slots.push(timeStr);
        }
      }
      
      // Advance by 30 mins (standard slot interval)
      currentSlot = addMinutes(currentSlot, 30);
    }

    return slots;
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !customerName || !customerPhone) {
      setError("Lütfen tüm alanları doldurun.");
      return;
    }

    setLoading(true);
    setError(null);

    // Client-side validation for phone and name
    const validation = bookingSchema.safeParse({ customerName, phone: customerPhone });
    if (!validation.success) {
      setError(validation.error.issues[0].message);
      setLoading(false);
      return;
    }

    // Create datetime string for scheduledAt
    const scheduledAt = parse(selectedTime, "HH:mm", selectedDate).toISOString();

    const result = await createBooking({
      shopId: shop.id,
      serviceId: selectedService.id,
      staffId: selectedStaffId,
      customerName,
      customerPhone,
      scheduledAt
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Bilinmeyen bir hata oluştu.");
    }
  };

  if (success) {
    return (
      <div className="p-10 rounded-3xl border text-center" style={{ background: "var(--bg2)", borderColor: "var(--border)" }}>
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-green-500/20 text-green-500">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-heading mb-3">Randevunuz Alındı!</h2>
        <p className="mb-6" style={{ color: "var(--text2)" }}>
          {customerName}, randevunuz başarıyla sisteme kaydedildi. Sizi bekliyoruz!
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
            <div key={num} className="flex-1 py-4 text-center text-xs font-bold uppercase tracking-widest relative"
              style={{ 
                color: step >= num ? "var(--text)" : "var(--text3)",
                background: step === num ? "rgba(255,255,255,0.02)" : "transparent"
              }}>
              <span className="opacity-50 mr-1">0{num}</span> {title}
              {step >= num && <div className="absolute bottom-0 left-0 w-full h-0.5" style={{ background: "var(--accent)" }} />}
            </div>
          );
        })}
      </div>

      <div className="p-8">
        {error && (
          <div className="p-4 mb-6 rounded-xl border bg-red-500/10 border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        {/* STEP 1: SERVICE */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-heading font-bold mb-6">Ne yaptırmak istersiniz?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((service: Service) => (
                <button
                  key={service.id}
                  onClick={() => { setSelectedService(service); setStep(hasStaff ? STAFF_STEP : DATE_STEP); }}
                  className="p-5 text-left rounded-2xl border transition-all hover:-translate-y-1"
                  style={{ 
                    background: selectedService?.id === service.id ? "var(--accent-dim)" : "var(--bg3)",
                    borderColor: selectedService?.id === service.id ? "var(--accent)" : "var(--border)"
                  }}
                >
                  <div className="font-bold text-lg mb-1">{service.name}</div>
                  <div className="text-sm font-medium flex items-center justify-end" style={{ color: "var(--text2)" }}>
                    <span className="font-bold" style={{ color: "var(--text)" }}>{service.price} ₺</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 1.5: STAFF */}
        {step === STAFF_STEP && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Personel Seçimi</h2>
              <button onClick={() => setStep(1)} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Geri</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => { setSelectedStaffId(null); setStep(DATE_STEP); }}
                className="p-5 text-left rounded-2xl border transition-all hover:-translate-y-1 flex items-center gap-3"
                style={{ 
                  background: selectedStaffId === null ? "var(--accent-dim)" : "var(--bg3)",
                  borderColor: selectedStaffId === null ? "var(--accent)" : "var(--border)"
                }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: "var(--bg2)", color: "var(--text)" }}>?</div>
                <div className="font-bold text-lg">Fark Etmez</div>
              </button>
              {staffList.map((staff: any) => (
                <button
                  key={staff.id}
                  onClick={() => { setSelectedStaffId(staff.id); setStep(DATE_STEP); }}
                  className="p-5 text-left rounded-2xl border transition-all hover:-translate-y-1 flex items-center gap-3"
                  style={{ 
                    background: selectedStaffId === staff.id ? "var(--accent-dim)" : "var(--bg3)",
                    borderColor: selectedStaffId === staff.id ? "var(--accent)" : "var(--border)"
                  }}
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{ background: "var(--bg2)", color: "var(--accent)" }}>{staff.name.charAt(0).toUpperCase()}</div>
                  <div className="font-bold text-lg">{staff.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: DATE & TIME */}
        {step === DATE_STEP && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Uygun Bir Zaman Seçin</h2>
              <button onClick={() => setStep(hasStaff ? STAFF_STEP : 1)} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Geri</button>
            </div>
            
            <div className="mb-6">
              <div className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Gün</div>
              <div className="flex gap-3 overflow-x-auto pb-4 hide-scrollbar">
                {availableDates.map((date, i) => {
                  const isSelected = selectedDate && isEqual(date, selectedDate);
                  return (
                    <button
                      key={i}
                      onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                      className="min-w-[80px] p-3 rounded-2xl border text-center transition-all shrink-0"
                      style={{ 
                        background: isSelected ? "var(--accent)" : "var(--bg3)",
                        borderColor: isSelected ? "var(--accent)" : "var(--border)",
                        color: isSelected ? "#0a0a0a" : "var(--text)"
                      }}
                    >
                      <div className="text-xs font-bold uppercase mb-1 opacity-60">
                        {format(date, "EEE", { locale: tr })}
                      </div>
                      <div className="text-xl font-black font-heading">
                        {format(date, "d")}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div>
                <div className="text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: "var(--text3)" }}>Saat</div>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {isStaffOnLeave ? (
                    <div className="col-span-4 sm:col-span-6 p-4 rounded-xl text-sm font-medium border text-center animate-in fade-in zoom-in duration-300"
                      style={{ background: "rgba(255,165,0,0.1)", borderColor: "rgba(255,165,0,0.3)", color: "#ffb74d" }}>
                      ⚠️ Seçtiğiniz personel bu tarihte izinlidir. Lütfen başka bir gün seçin veya geri dönüp farklı bir personel tercih edin.
                    </div>
                  ) : getAvailableTimes().length > 0 ? (
                    getAvailableTimes().map((time, i) => {
                      const isSelected = selectedTime === time;
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedTime(time)}
                          className="p-3 rounded-xl border text-sm font-bold transition-all"
                          style={{ 
                            background: isSelected ? "var(--text)" : "transparent",
                            borderColor: isSelected ? "var(--text)" : "var(--border)",
                            color: isSelected ? "var(--bg)" : "var(--text)"
                          }}
                        >
                          {time}
                        </button>
                      );
                    })
                  ) : (
                    <div className="col-span-4 sm:col-span-6 text-sm py-4 text-center" style={{ color: "var(--text3)" }}>
                      Bu gün için uygun randevu saati bulunmuyor.
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedTime && (
              <button 
                onClick={() => setStep(INFO_STEP)}
                className="w-full mt-8 py-4 rounded-xl font-bold transition-all hover:-translate-y-0.5"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}
              >
                Devam Et
              </button>
            )}
          </div>
        )}

        {/* STEP 3: CUSTOMER INFO */}
        {step === INFO_STEP && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-heading font-bold">Kişisel Bilgileriniz</h2>
              <button onClick={() => setStep(DATE_STEP)} className="text-xs font-bold px-3 py-1.5 rounded-lg border hover:bg-white/5" style={{ borderColor: "var(--border)", color: "var(--text2)" }}>Geri</button>
            </div>

            <form onSubmit={handleBooking} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
                  Adınız Soyadınız
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none transition-colors"
                  style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--text2)" }}>
                  Telefon Numaranız
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="555 123 45 67"
                  className="w-full px-4 py-3.5 rounded-xl text-sm border focus:outline-none transition-colors"
                  style={{ background: "var(--bg3)", borderColor: "var(--border)", color: "var(--text)" }}
                />
                <p className="text-xs mt-2" style={{ color: "var(--text3)" }}>
                  Size randevu hatırlatması gönderebilmemiz için geçerli bir numara giriniz.
                </p>
              </div>

              <div className="p-4 rounded-xl border mt-6" style={{ background: "var(--bg)", borderColor: "var(--border)" }}>
                <div className="text-sm font-bold mb-2">Randevu Özeti</div>
                <div className="text-sm flex justify-between mb-1" style={{ color: "var(--text2)" }}>
                  <span>Hizmet:</span>
                  <span className="font-medium text-white">{selectedService?.name}</span>
                </div>
                {hasStaff && (
                  <div className="text-sm flex justify-between mb-1" style={{ color: "var(--text2)" }}>
                    <span>Personel:</span>
                    <span className="font-medium text-white">{selectedStaffId ? staffList.find((s: any) => s.id === selectedStaffId)?.name : "Fark Etmez"}</span>
                  </div>
                )}
                <div className="text-sm flex justify-between" style={{ color: "var(--text2)" }}>
                  <span>Tarih & Saat:</span>
                  <span className="font-medium text-white">
                    {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: tr })} - {selectedTime}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold transition-all disabled:opacity-50 hover:-translate-y-0.5 mt-4"
                style={{ background: "var(--accent)", color: "#0a0a0a" }}
              >
                {loading ? "Onaylanıyor..." : "Randevuyu Onayla"}
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
