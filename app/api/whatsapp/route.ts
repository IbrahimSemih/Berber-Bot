import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Redis } from "@upstash/redis";

// Supabase service client
function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// WhatsApp mesajı gönder
async function sendMessage(to: string, text: string) {
  await fetch(
    `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    }
  );
}

// ─── Redis Session Management ─────────────────────────────────────────────
let redis: Redis;
try {
  redis = Redis.fromEnv();
} catch (e) {
  console.warn("Redis env variables not found, session management might fail if not configured properly.");
}

type SessionData = {
  step: "service" | "date" | "time" | "name" | "cancel_select" | "done";
  shopId: string;
  shopName: string;
  serviceId?: string;
  serviceName?: string;
  date?: string;
  chosenTime?: string;
  scheduledAt?: string;
  cancellableAppointments?: any[];
};

async function getSession(phone: string): Promise<SessionData | null> {
  if (!redis) return null;
  return await redis.get<SessionData>(`session:${phone}`);
}

async function setSession(phone: string, data: SessionData) {
  if (!redis) return;
  await redis.set(`session:${phone}`, data, { ex: 3600 * 24 }); // 24 hours
}

async function clearSession(phone: string) {
  if (!redis) return;
  await redis.del(`session:${phone}`);
}

// ─── GET: Webhook doğrulama ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ─── POST: Gelen mesajları işle ───────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const msg = change?.value?.messages?.[0];

    if (!msg) return NextResponse.json({ ok: true });

    const phone = msg.from; // örn: 905321234567
    const text = (msg.text?.body ?? "").trim().toLocaleLowerCase("tr-TR");

    if (!text) return NextResponse.json({ ok: true });

    await handleMessage(phone, text);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}

// ─── Bot mantığı ──────────────────────────────────────────────────────────
async function handleMessage(phone: string, text: string) {
  let session = await getSession(phone);
  const supabase = db();

  // ── ROUTING MANTIĞI (İLK MESAJ) ───────────────────────────────────────
  if (text.includes(":")) {
    const parts = text.split(":");
    const possibleSlug = parts[parts.length - 1].trim();
    
    const { data: shop } = await supabase.from("shops").select("*").eq("slug", possibleSlug).single();
    if (shop) {
      session = { step: "service", shopId: shop.id, shopName: shop.name };
      await setSession(phone, session);
    }
  }

  if (!session) {
    // Fallback: İlk defa geliyorsa ve slug belirtilmemişse, varsayılan bir dükkan seçelim
    // Gerçek bir SaaS'ta burada "Hangi dükkan için randevu almak istiyorsunuz?" veya hata döndürülebilir.
    const { data: defaultShop } = await supabase.from("shops").select("*").limit(1).single();
    if (!defaultShop) {
      await sendMessage(phone, "Sistemde kayıtlı dükkan bulunamadı.");
      return;
    }
    session = { step: "service", shopId: defaultShop.id, shopName: defaultShop.name };
    await setSession(phone, session);
  }

  // ── İPTAL AKIŞI ────────────────────────────────────────────────────────
  if (/iptal|vazgeç/.test(text)) {
    await clearSession(phone);
    
    // Müşteriyi bul
    const { data: customer } = await supabase.from("customers").select("id").eq("phone", `+${phone}`).eq("shop_id", session.shopId).single();
    
    if (!customer) {
      await sendMessage(phone, "Sistemde iptal edilecek kayıtlı bir randevunuz bulunamadı.");
      return;
    }

    // Gelecekteki randevuları bul
    const now = new Date().toISOString();
    const { data: appointments } = await supabase
      .from("appointments")
      .select(`id, scheduled_at, service:services(name)`)
      .eq("customer_id", customer.id)
      .eq("shop_id", session.shopId)
      .eq("status", "confirmed")
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true });

    if (!appointments || appointments.length === 0) {
      await sendMessage(phone, "Şu an iptal edilecek aktif/gelecek bir randevunuz bulunmuyor.");
      return;
    }

    // Seçim yapması için listele
    const list = appointments.map((a: any, i: number) => {
      const srvName = Array.isArray(a.service) ? a.service[0]?.name : a.service?.name;
      const time = a.scheduled_at.substring(11, 16);
      return `${i + 1}. ${formatDateLabel(a.scheduled_at.split("T")[0], time)} - ${srvName}`;
    }).join("\n");

    session.step = "cancel_select";
    session.cancellableAppointments = appointments;
    await setSession(phone, session);

    await sendMessage(phone, `İptal edebileceğiniz randevularınız:\n\n${list}\n\nHangisini iptal etmek istersiniz? Lütfen sadece numarasını gönderin.`);
    return;
  }

  // ── ADIM 1: Başlangıç ─────────────────────────────────────────────────
  if (/merhaba|selam|randevu|başla/.test(text)) {
    // Hizmetleri DB'den çek
    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", session.shopId)
      .eq("is_active", true);

    if (!services?.length) {
      await sendMessage(phone, "Şu an hizmet bilgisi alınamıyor, lütfen daha sonra tekrar deneyin.");
      return;
    }

    const list = services
      .map((s, i) => `${i + 1}. ${s.name} — ₺${s.price} (${s.duration_minutes} dk)`)
      .join("\n");

    session.step = "service";
    await setSession(phone, session);

    await sendMessage(phone,
      `Merhaba! 👋 *${session.shopName}* hoş geldiniz.\n\nHangi hizmeti almak istersiniz?\n\n${list}\n\nLütfen numara gönderin (örn: *1*)`
    );
    return;
  }

  // ── ADIM 2: Hizmet seçimi ─────────────────────────────────────────────
  if (session.step === "service") {
    const { data: services } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", session.shopId)
      .eq("is_active", true);

    const idx = parseInt(text) - 1;
    const chosen = services?.[idx];

    if (!chosen) {
      await sendMessage(phone, `Geçersiz seçim. Lütfen 1-${services?.length} arasında bir numara gönderin.`);
      return;
    }

    session.step = "date";
    session.serviceId = chosen.id;
    session.serviceName = chosen.name;
    await setSession(phone, session);

    const { data: settings } = await supabase.from("settings").select("*").eq("shop_id", session.shopId).limit(1).single();
    const workingHours = settings?.working_hours || [];
    
    // Yalnızca is_open: true olan günlerin indexlerini alalım
    const openDays = workingHours.filter((wh: any) => wh.is_open).map((wh: any) => wh.day);

    const maxDaysToShow = Math.min(5, openDays.length);
    const days = getNextDays(maxDaysToShow, openDays);
    
    if (!days.length) {
      await sendMessage(phone, `Maalesef şu an müsait bir gün bulunmuyor.`);
      return;
    }
    const list = days.map((d, i) => `${i + 1}. ${d.label}`).join("\n");

    await sendMessage(phone,
      `*${chosen.name}* seçtiniz ✂️\n\nHangi gün istersiniz?\n\n${list}\n\nLütfen numara gönderin.`
    );
    return;
  }

  // ── ADIM 3: Gün seçimi ────────────────────────────────────────────────
  if (session.step === "date") {
    const { data: settings } = await supabase.from("settings").select("*").eq("shop_id", session.shopId).limit(1).single();
    const workingHours = settings?.working_hours || [];
    const openDays = workingHours.filter((wh: any) => wh.is_open).map((wh: any) => wh.day);
    
    const maxDaysToShow = Math.min(5, openDays.length);
    const days = getNextDays(maxDaysToShow, openDays);
    const idx = parseInt(text) - 1;
    const chosen = days[idx];

    if (!chosen) {
      await sendMessage(phone, `Geçersiz seçim. Lütfen 1-${days.length} arasında numara gönderin.`);
      return;
    }

    // O gün için dolu saatleri çek
    const { data: booked } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("shop_id", session.shopId)
      .gte("scheduled_at", `${chosen.iso}T00:00:00`)
      .lte("scheduled_at", `${chosen.iso}T23:59:59`)
      .neq("status", "cancelled");

    const bookedTimes = (booked ?? []).map((a) => {
      return a.scheduled_at.substring(11, 16);
    });

    const chosenDayOfWeek = new Date(chosen.iso).getDay();
    const daySettings = workingHours.find((wh: any) => wh.day === chosenDayOfWeek) || { start: "09:00", end: "20:00" };
    
    // Hizmetin süresini db'den almak daha güvenli ama session'da da tutabiliriz. Şimdilik sabit aralıklarla yapalım veya dinamik
    const slots = getSlots(daySettings.start, daySettings.end).filter((s) => !bookedTimes.includes(s));

    if (!slots.length) {
      await sendMessage(phone, `${chosen.label} için müsait saat yok. Başka bir gün seçin.\n\n${days.map((d, i) => `${i + 1}. ${d.label}`).join("\n")}`);
      return;
    }

    session.step = "time";
    session.date = chosen.iso;
    await setSession(phone, session);

    const list = slots.map((s, i) => `${i + 1}. ${s}`).join("\n");
    await sendMessage(phone,
      `${chosen.label} için müsait saatler:\n\n${list}\n\nLütfen numara gönderin.`
    );
    return;
  }

  // ── ADIM 4: Saat seçimi & kayıt ──────────────────────────────────────
  if (session.step === "time") {
    const { data: settings } = await supabase.from("settings").select("*").eq("shop_id", session.shopId).limit(1).single();
    
    const { data: booked } = await supabase
      .from("appointments")
      .select("scheduled_at")
      .eq("shop_id", session.shopId)
      .gte("scheduled_at", `${session.date}T00:00:00`)
      .lte("scheduled_at", `${session.date}T23:59:59`)
      .neq("status", "cancelled");

    const bookedTimes = (booked ?? []).map((a) => {
      return a.scheduled_at.substring(11, 16);
    });
    
    const chosenDayOfWeek = new Date(session.date!).getDay();
    const workingHours = settings?.working_hours || [];
    const daySettings = workingHours.find((wh: any) => wh.day === chosenDayOfWeek) || { start: "09:00", end: "20:00" };

    const slots = getSlots(daySettings.start, daySettings.end).filter((s) => !bookedTimes.includes(s));

    const idx = parseInt(text) - 1;
    const chosenTime = slots[idx];

    if (!chosenTime) {
      await sendMessage(phone, `Geçersiz seçim. Lütfen 1-${slots.length} arasında numara gönderin.`);
      return;
    }

    const scheduledAt = `${session.date}T${chosenTime}:00`;

    session.step = "name";
    session.chosenTime = chosenTime;
    session.scheduledAt = scheduledAt;
    await setSession(phone, session);
    
    await sendMessage(phone, `Harika! Randevunuzu tamamlamak üzereyim.\n\nLütfen adınızı ve soyadınızı yazar mısınız?`);
    return;
  }

  // ── ADIM 5: İsim alma & Kayıt ───────────────────────────────────────────
  if (session.step === "name") {
    const customerName = text.trim();

    // Müşteriyi upsert et (ismiyle birlikte)
    const { data: customer } = await supabase
      .from("customers")
      .upsert({ shop_id: session.shopId, phone: `+${phone}`, name: customerName }, { onConflict: "shop_id,phone" })
      .select()
      .single();

    // Randevuyu kaydet
    await supabase.from("appointments").insert({
      shop_id: session.shopId,
      customer_id: customer?.id,
      service_id: session.serviceId,
      scheduled_at: session.scheduledAt,
      status: "confirmed",
      source: "whatsapp",
    });

    const dateLabel = formatDateLabel(session.date!, session.chosenTime!);
    const shopName = session.shopName;
    const serviceName = session.serviceName;
    const shopId = session.shopId;
    
    await clearSession(phone);

    await sendMessage(phone,
      `✅ *Sayın ${customerName}, randevunuz oluşturuldu!*\n\n📅 ${dateLabel}\n💈 ${serviceName}\n📍 ${shopName}\n\nBir gün önce hatırlatma göndereceğim. Görüşmek üzere! 🙏\n\n_(Not: Randevunuzu iptal etmek isterseniz dilediğiniz zaman bana *iptal* yazabilirsiniz)_`
    );

    // İşletme sahibine bildirim (Yeni randevu)
    const { data: settings } = await supabase.from("settings").select("whatsapp_number, notify_new").eq("shop_id", shopId).limit(1).single();
    if (settings?.whatsapp_number && settings?.notify_new !== false) {
       let adminPhone = settings.whatsapp_number.replace(/\D/g, '');
       if (adminPhone.startsWith('0')) adminPhone = '90' + adminPhone.substring(1);
       else if (!adminPhone.startsWith('90')) adminPhone = '90' + adminPhone;

       if (adminPhone) {
         try {
           await sendMessage(adminPhone, `🔔 *YENİ RANDEVU*\n\nMüşteri: ${customerName}\n📞 Telefon: +${phone}\n📅 Tarih: ${dateLabel}\n💈 Hizmet: ${serviceName}`);
         } catch(e) {}
       }
    }

    return;
  }

  // ── ADIM 6: İptal Seçimi ────────────────────────────────────────────────
  if (session.step === "cancel_select") {
    const appointments = session.cancellableAppointments || [];
    const idx = parseInt(text) - 1;
    const chosenAppt = appointments[idx];

    if (!chosenAppt) {
      await sendMessage(phone, `Geçersiz seçim. Lütfen 1-${appointments.length} arasında numara gönderin.`);
      return;
    }

    // Randevuyu iptal et
    await supabase.from("appointments").update({ status: "cancelled" }).eq("id", chosenAppt.id).eq("shop_id", session.shopId);
    
    const shopId = session.shopId;
    await clearSession(phone);

    // İşletme sahibine bildirim
    const { data: settings } = await supabase.from("settings").select("whatsapp_number").eq("shop_id", shopId).limit(1).single();
    if (settings?.whatsapp_number) {
       const srvName = Array.isArray(chosenAppt.service) ? chosenAppt.service[0]?.name : chosenAppt.service?.name;
       const time = chosenAppt.scheduled_at.substring(11, 16);
       const dateLabel = formatDateLabel(chosenAppt.scheduled_at.split("T")[0], time);
       
       const { data: customer } = await supabase.from("customers").select("name").eq("phone", `+${phone}`).eq("shop_id", shopId).single();
       const custName = customer?.name || "İsimsiz";

       let adminPhone = settings.whatsapp_number.replace(/\D/g, '');
       if (adminPhone.startsWith('0')) adminPhone = '90' + adminPhone.substring(1);
       else if (!adminPhone.startsWith('90')) adminPhone = '90' + adminPhone;

       if (adminPhone) {
         try {
           await sendMessage(adminPhone, `⚠️ *İPTAL BİLDİRİMİ*\n\nMüşteriniz ${custName}, şu randevusunu iptal etti:\n📅 ${dateLabel}\n💈 ${srvName}\n\nO saat dilimi tekrar sisteme açıldı.`);
         } catch(e) {}
       }
    }

    await sendMessage(phone, "Randevunuz başarıyla iptal edildi ✅\n\nİlgili saat dilimi başka müşteriler için boşa çıkarıldı. Yeni randevu için *merhaba* yazabilirsiniz.");
    return;
  }

  // Fallback
  await sendMessage(phone, "Anlayamadım 🤔 Randevu için *merhaba* yazabilirsiniz.");
}

// ─── Yardımcı fonksiyonlar ────────────────────────────────────────────────
function getNextDays(count: number, workDays: number[]) {
  const days = [];
  const tr = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  
  let d = new Date();
  let added = 0;
  
  for (let i = 1; added < count && i < 30; i++) {
    d.setDate(d.getDate() + 1);
    const dayOfWeek = d.getDay();
    
    if (workDays.includes(dayOfWeek)) {
      const iso = d.toISOString().split("T")[0];
      const label = `${tr[dayOfWeek]} ${d.getDate()}/${d.getMonth() + 1}`;
      days.push({ iso, label });
      added++;
    }
  }
  return days;
}

function getSlots(workStart?: string, workEnd?: string): string[] {
  const slots = [];
  const startStr = workStart || "09:00";
  const endStr = workEnd || "20:00";
  
  let [startHour, startMin] = startStr.split(":").map(Number);
  let [endHour, endMin] = endStr.split(":").map(Number);
  
  if (isNaN(startHour)) startHour = 9;
  if (isNaN(startMin)) startMin = 0;
  if (isNaN(endHour)) endHour = 20;
  if (isNaN(endMin)) endMin = 0;

  const startTotalMins = startHour * 60 + startMin;
  const endTotalMins = endHour * 60 + endMin;

  for (let mins = startTotalMins; mins < endTotalMins; mins += 30) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  
  return slots;
}

function formatDateLabel(date: string, time: string) {
  const d = new Date(date);
  const tr = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
  return `${tr[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}, saat ${time}`;
}
