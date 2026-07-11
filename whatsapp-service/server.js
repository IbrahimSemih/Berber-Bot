require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { createClient } = require('@supabase/supabase-js');
const { addDays, format, startOfDay, endOfDay, isSameDay, getDay, parse, addMinutes, isAfter, isBefore, isEqual } = require('date-fns');
const cron = require('node-cron');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Backend olduğu için tam yetkili key kullanıyoruz
);

// In-memory store
const sessions = {}; // WhatsApp Client sessions: { shopId: { client, status, qrCodeUrl } }
const chatStates = {}; // Customer chat states: { shopId_customerPhone: { step, data } }

// Açık olan günleri listeleme yardımcı fonksiyonu (Tekrarı önlemek için)
async function askForDay(shopId, phone, chatState, msg, prefixMsg = "") {
    const { days, workingHours } = await getAvailableDays(shopId);
    chatState.data.workingHours = workingHours;

    if (days.length === 0) {
        resetChatState(shopId, phone);
        return msg.reply('Şu anda uygun gün bulunmuyor. Lütfen daha sonra tekrar deneyin.');
    }

    chatState.data.availableDays = days;

    let reply = `${prefixMsg}\n\nLütfen randevu almak istediğiniz günün *numarasını* yazın:\n\n`;
    days.forEach((d, i) => {
        const dayName = GUN_ADLARI[getDay(d)];
        const dateStr = format(d, 'dd.MM.yyyy');
        const isToday = isSameDay(d, new Date());
        const label = isToday ? 'Bugün' : (isSameDay(d, addDays(new Date(), 1)) ? 'Yarın' : dayName);
        reply += `${i + 1}. ${label} — ${dateStr} (${dayName})\n`;
    });

    chatState.step = STEPS.SELECT_DAY;
    return msg.reply(reply);
}

// Adımlar: IDLE -> SELECT_SERVICE -> SELECT_STAFF -> SELECT_DAY -> SELECT_TIME -> ENTER_NAME
const STEPS = {
    IDLE: 'IDLE',
    SELECT_SERVICE: 'SELECT_SERVICE',
    SELECT_STAFF: 'SELECT_STAFF',
    SELECT_DAY: 'SELECT_DAY',
    SELECT_TIME: 'SELECT_TIME',
    ENTER_NAME: 'ENTER_NAME'
};

// ─── Yardımcı Fonksiyonlar ──────────────────────────────────────────────────

/**
 * Dükkanın çalışma saatlerini DB'den çekip, bugünden itibaren bir sonraki N açık günü döndürür.
 */
async function getAvailableDays(shopId, count = 7) {
    const { data: settings } = await supabase
        .from('settings')
        .select('working_hours')
        .eq('shop_id', shopId)
        .single();

    // working_hours: [{day:0, is_open:false, start:"09:00", end:"20:00"}, ...]
    // day: 0=Pazar, 1=Pazartesi, ... 6=Cumartesi  (JS getDay() ile aynı)
    const workingHours = settings?.working_hours || [];
    const openDayNumbers = workingHours
        .filter(wh => wh.is_open)
        .map(wh => wh.day);

    const days = [];
    let cursor = new Date();
    // Bugünün geri kalan saatlerine de izin ver — cursor bugünden başlasın
    for (let i = 0; i < 30 && days.length < count; i++) {
        const candidate = addDays(cursor, i);
        const jsDay = getDay(candidate); // 0-6
        if (openDayNumbers.includes(jsDay)) {
            days.push(candidate);
        }
    }
    return { days, workingHours };
}

/**
 * Belirli bir gün için çalışma saatlerini ve hizmet süresini kullanarak
 * olası zaman dilimlerini üretir.
 */
function generateTimeSlots(date, workingHours, serviceDurationMinutes) {
    const jsDay = getDay(date);
    const dayConfig = workingHours.find(wh => wh.day === jsDay);
    if (!dayConfig || !dayConfig.is_open) return [];

    const startTime = parse(dayConfig.start, 'HH:mm', date);
    const endTime = parse(dayConfig.end, 'HH:mm', date);

    const slots = [];
    let current = startTime;
    while (isBefore(addMinutes(current, serviceDurationMinutes), endTime) || isEqual(addMinutes(current, serviceDurationMinutes), endTime)) {
        slots.push(format(current, 'HH:mm'));
        current = addMinutes(current, serviceDurationMinutes);
    }
    return slots;
}

/**
 * Belirli bir gün ve dükkan için DB'deki mevcut randevuları çekip
 * dolu olan saat dizisini döndürür. Personel kapasitesini dikkate alır.
 */
async function getBookedTimes(shopId, date, selectedStaffId = null) {
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    // 1. Dükkandaki aktif personel sayısını bul
    const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('shop_id', shopId)
        .eq('is_active', true);

    // Eğer hiç personel eklenmemişse varsayılan kapasite 1'dir.
    const totalCapacity = staffData && staffData.length > 0 ? staffData.length : 1;

    // 2. O günkü tüm randevuları çek
    const { data: appointments } = await supabase
        .from('appointments')
        .select('scheduled_at, staff_id')
        .eq('shop_id', shopId)
        .in('status', ['pending', 'confirmed'])
        .gte('scheduled_at', dayStart)
        .lte('scheduled_at', dayEnd);

    if (!appointments || appointments.length === 0) return [];

    // Saat bazında randevu sayılarını ve kimlere atandığını grupla
    const timeGroups = {};
    appointments.forEach(a => {
        const timeStr = format(new Date(a.scheduled_at), 'HH:mm');
        if (!timeGroups[timeStr]) timeGroups[timeStr] = { count: 0, staffIds: [] };
        timeGroups[timeStr].count += 1;
        if (a.staff_id) timeGroups[timeStr].staffIds.push(a.staff_id);
    });

    const bookedSlots = [];

    for (const [time, data] of Object.entries(timeGroups)) {
        // Eğer o saatteki randevu sayısı toplam kapasiteye ulaştıysa (veya aştıysa), o saat herkes için doludur.
        if (data.count >= totalCapacity) {
            bookedSlots.push(time);
        } else if (selectedStaffId) {
            // Kapasite var ama kullanıcının seçtiği personel o saatte dolu mu?
            if (data.staffIds.includes(selectedStaffId)) {
                bookedSlots.push(time);
            }
        }
    }

    return bookedSlots;
}

/**
 * Bugün için: şu andan önce kalan saatleri filtreler.
 */
function filterPastTimesIfToday(date, slots) {
    const now = new Date();
    if (!isSameDay(date, now)) return slots;
    const currentTime = format(now, 'HH:mm');
    return slots.filter(slot => slot > currentTime);
}

const GUN_ADLARI = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function getSessionState(shopId) {
    if (!sessions[shopId]) {
        sessions[shopId] = {
            client: null,
            status: 'DISCONNECTED',
            qrCodeUrl: null,
        };
    }
    return sessions[shopId];
}

function getChatState(shopId, customerPhone) {
    const key = `${shopId}_${customerPhone}`;
    if (!chatStates[key]) {
        chatStates[key] = { step: STEPS.IDLE, data: {} };
    }
    return chatStates[key];
}

function resetChatState(shopId, customerPhone) {
    const key = `${shopId}_${customerPhone}`;
    chatStates[key] = { step: STEPS.IDLE, data: {} };
}

// WhatsApp mesaj işleme mantığı
async function handleIncomingMessage(shopId, msg) {
    // WhatsApp durum (story) güncellemelerini yoksay
    if (msg.from === 'status@broadcast') {
        return;
    }

    console.log(`[${shopId}] Received message from ${msg.from}: ${msg.body}`);
    // Sadece gruplardan gelmeyen normal mesajları işle
    const chat = await msg.getChat();
    if (chat.isGroup) {
        console.log(`[${shopId}] Ignoring group message from ${msg.from}`);
        return;
    }

    const phone = msg.from.replace('@c.us', '');
    const text = msg.body.trim().toLowerCase();
    const chatState = getChatState(shopId, phone);

    console.log(`[${shopId}] Chat state for ${phone}:`, chatState.step);

    // Eğer kullanıcı 'iptal' yazarsa her zaman başa dön
    if (text === 'iptal' || text === 'çıkış') {
        resetChatState(shopId, phone);
        return msg.reply('İşleminiz iptal edildi. Tekrar randevu almak için "randevu" yazabilirsiniz.');
    }

    try {
        if (chatState.step === STEPS.IDLE) {
            const triggers = ['randevu', 'kesim'];
            const isTriggered = triggers.some(t => text.includes(t));

            console.log(`[${shopId}] IDLE state, isTriggered:`, isTriggered);

            if (isTriggered) {
                // 1. Hizmetleri Çek
                const { data: services, error } = await supabase
                    .from('services')
                    .select('*')
                    .eq('shop_id', shopId)
                    .eq('is_active', true);

                console.log(`[${shopId}] Fetched services:`, services?.length, 'error:', error);

                if (error || !services || services.length === 0) {
                    return msg.reply('Şu anda aktif hizmet bulunmuyor. Lütfen daha sonra tekrar deneyin.');
                }

                // Hizmetleri listele
                let reply = "Randevu sistemine hoş geldiniz! Lütfen almak istediğiniz hizmetin *numarasını* yazın:\n\n";
                services.forEach((s, index) => {
                    reply += `${index + 1}. ${s.name} (${s.price} TL)\n`;
                });

                chatState.data.services = services;
                chatState.step = STEPS.SELECT_SERVICE;
                return msg.reply(reply);
            } else {
                // Sessiz mod: Tetikleyici kelime yoksa hiçbir şey yapma (görmezden gel)
                return;
            }
        }
        else if (chatState.step === STEPS.SELECT_SERVICE) {
            const selectedIndex = parseInt(text) - 1;
            const services = chatState.data.services;

            if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= services.length) {
                return msg.reply('Lütfen geçerli bir numara girin (Örn: 1).');
            }

            const selectedService = services[selectedIndex];
            chatState.data.service = selectedService;

            // Personelleri çek
            const { data: staffList } = await supabase
                .from('staff')
                .select('*')
                .eq('shop_id', shopId)
                .eq('is_active', true);

            if (staffList && staffList.length > 0) {
                chatState.data.staffList = staffList;
                let reply = `*${selectedService.name}* hizmetini seçtiniz.\n\nLütfen randevu almak istediğiniz personelin numarasını yazın:\n\n`;
                reply += `0. Fark Etmez (İlk Müsait)\n`;
                staffList.forEach((st, i) => {
                    reply += `${i + 1}. ${st.name}\n`;
                });
                chatState.step = STEPS.SELECT_STAFF;
                return msg.reply(reply);
            } else {
                chatState.data.selectedStaffId = null;
                return await askForDay(shopId, phone, chatState, msg, `*${selectedService.name}* hizmetini seçtiniz.`);
            }
        }
        else if (chatState.step === STEPS.SELECT_STAFF) {
            const selectedIndex = parseInt(text);
            const staffList = chatState.data.staffList;

            if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex > staffList.length) {
                return msg.reply('Lütfen geçerli bir numara girin (Örn: 1 veya 0).');
            }

            if (selectedIndex === 0) {
                chatState.data.selectedStaffId = null;
                chatState.data.selectedStaffName = "Fark Etmez";
            } else {
                const selectedStaff = staffList[selectedIndex - 1];
                chatState.data.selectedStaffId = selectedStaff.id;
                chatState.data.selectedStaffName = selectedStaff.name;
            }

            return await askForDay(shopId, phone, chatState, msg, `Personel tercihi: *${chatState.data.selectedStaffName}*.`);
        }
        else if (chatState.step === STEPS.SELECT_DAY) {
            const selectedIndex = parseInt(text) - 1;
            const days = chatState.data.availableDays;

            if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= days.length) {
                return msg.reply(`Lütfen 1 ile ${days.length} arasında bir numara girin.`);
            }

            const selectedDate = days[selectedIndex];
            chatState.data.targetDate = selectedDate;

            const service = chatState.data.service;
            const workingHours = chatState.data.workingHours;

            // 1. Çalışma saatlerine göre tüm slotları üret
            let allSlots = generateTimeSlots(selectedDate, workingHours, service.duration_minutes);

            // 2. Bugünse geçmiş saatleri çıkar
            allSlots = filterPastTimesIfToday(selectedDate, allSlots);

            // 3. DB'den dolu saatleri çek ve çıkar (Personel bazlı)
            const bookedTimes = await getBookedTimes(shopId, selectedDate, chatState.data.selectedStaffId);
            const availableTimes = allSlots.filter(slot => !bookedTimes.includes(slot));

            if (availableTimes.length === 0) {
                // Bu gün için boş saat yok — gün seçimine geri dön
                chatState.step = STEPS.SELECT_DAY;
                let reply = `Seçtiğiniz gün için uygun saat bulunmuyor. Lütfen başka bir gün seçin:\n\n`;
                days.forEach((d, i) => {
                    const dayName = GUN_ADLARI[getDay(d)];
                    const dateStr = format(d, 'dd.MM.yyyy');
                    const isToday = isSameDay(d, new Date());
                    const label = isToday ? 'Bugün' : (isSameDay(d, addDays(new Date(), 1)) ? 'Yarın' : dayName);
                    reply += `${i + 1}. ${label} — ${dateStr} (${dayName})\n`;
                });
                return msg.reply(reply);
            }

            chatState.data.availableTimes = availableTimes;

            const dayName = GUN_ADLARI[getDay(selectedDate)];
            const dateStr = format(selectedDate, 'dd.MM.yyyy');

            let reply = `📅 *${dayName}, ${dateStr}* için uygun saatler:\n\n`;
            reply += availableTimes.join(' | ');
            reply += `\n\nLütfen istediğiniz saati yazın (Örn: ${availableTimes[0]}).`;

            chatState.step = STEPS.SELECT_TIME;
            return msg.reply(reply);
        }
        else if (chatState.step === STEPS.SELECT_TIME) {
            const selectedTime = text;
            const availableTimes = chatState.data.availableTimes;

            if (!availableTimes.includes(selectedTime)) {
                return msg.reply('Lütfen yukarıdaki uygun saatlerden birini tam olarak yazın (Örn: 10:00).');
            }

            chatState.data.selectedTime = selectedTime;
            chatState.step = STEPS.ENTER_NAME;

            return msg.reply('Son olarak, randevu kaydınız için lütfen *Adınızı ve Soyadınızı* yazın:');
        }
        else if (chatState.step === STEPS.ENTER_NAME) {
            const customerName = msg.body.trim(); // case-sensitive for name

            if (customerName.length < 2) {
                return msg.reply('Lütfen geçerli bir isim girin.');
            }

            const selectedTime = chatState.data.selectedTime;
            const service = chatState.data.service;
            const targetDate = chatState.data.targetDate;
            const timeParts = selectedTime.split(':');

            // Tarih objesini saat ile birleştir
            targetDate.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);

            // 1. Müşteriyi DB'de bul veya oluştur
            let customerId;
            const { data: existingCustomer } = await supabase
                .from('customers')
                .select('id')
                .eq('shop_id', shopId)
                .eq('phone', phone)
                .single();

            if (existingCustomer) {
                customerId = existingCustomer.id;
                // Müşteri ismini güncelleyelim
                await supabase.from('customers').update({ name: customerName }).eq('id', customerId);
            } else {
                const { data: newCustomer } = await supabase
                    .from('customers')
                    .insert([{ shop_id: shopId, phone: phone, name: customerName }])
                    .select('id')
                    .single();
                customerId = newCustomer?.id;
            }

            // 2. Randevuyu kaydet
            const { error: aptError } = await supabase
                .from('appointments')
                .insert([{
                    shop_id: shopId,
                    customer_id: customerId,
                    service_id: service.id,
                    staff_id: chatState.data.selectedStaffId || null,
                    scheduled_at: targetDate.toISOString(),
                    status: 'confirmed',
                    source: 'whatsapp'
                }]);

            if (aptError) {
                console.error("Appointment save error:", aptError);
                return msg.reply('Randevunuz kaydedilirken bir sorun oluştu. Lütfen dükkanı doğrudan arayın.');
            }

            // Başarılı!
            const dayName = GUN_ADLARI[getDay(targetDate)];
            const dateStr = format(targetDate, 'dd.MM.yyyy');
            resetChatState(shopId, phone);
            return msg.reply(`✅ Harika! *${dayName}, ${dateStr}* saat *${selectedTime}* için *${service.name}* randevunuz başarıyla oluşturuldu. Bizi tercih ettiğiniz için teşekkür ederiz, ${customerName}!`);
        }
    } catch (e) {
        console.error("Chat flow error:", e);
        resetChatState(shopId, phone);
        return msg.reply('Bir hata oluştu. Lütfen tekrar "randevu" yazarak baştan başlayın.');
    }
}

function setupAndInitializeClient(shopId) {
    let state = getSessionState(shopId);
    state.status = 'INITIALIZING';
    state.qrCodeUrl = null;

    console.log(`[${shopId}] Initializing new WhatsApp Client...`);

    const client = new Client({
        authStrategy: new LocalAuth({ clientId: shopId }),
        puppeteer: {
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--disable-gpu'
            ]
        },
        webVersionCache: {
            type: 'remote',
            remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        }
    });

    state.client = client;

    client.on('qr', async (qr) => {
        console.log(`[${shopId}] QR Code Received.`);
        state.status = 'QR_READY';
        state.qrCodeUrl = await qrcode.toDataURL(qr);
    });

    client.on('ready', async () => {
        console.log(`[${shopId}] WhatsApp Client is READY!`);
        state.status = 'CONNECTED';
        state.qrCodeUrl = null;

        // Numara kaydet
        if (client.info && client.info.wid) {
            const phoneStr = client.info.wid.user;
            await supabase.from('settings').update({ whatsapp_number: phoneStr }).eq('shop_id', shopId);
            console.log(`[${shopId}] Saved WhatsApp number to DB: ${phoneStr}`);
        }
    });

    client.on('authenticated', () => {
        console.log(`[${shopId}] Authenticated successfully.`);
    });

    client.on('auth_failure', msg => {
        console.error(`[${shopId}] Authentication failure:`, msg);
        state.status = 'DISCONNECTED';
    });

    client.on('disconnected', (reason) => {
        console.log(`[${shopId}] Client was logged out or disconnected:`, reason);
        state.status = 'DISCONNECTED';
        state.client = null;
    });

    // Müşteri mesajı geldiğinde
    client.on('message', async msg => {
        await handleIncomingMessage(shopId, msg);
    });

    client.initialize().catch(err => {
        console.error(`[${shopId}] Error initializing client:`, err);
        state.status = 'DISCONNECTED';
    });
}

app.post('/api/whatsapp/connect', (req, res) => {
    const { shopId } = req.body;
    if (!shopId) return res.status(400).json({ error: 'shopId required' });

    let state = getSessionState(shopId);

    if (state.status === 'CONNECTED' || state.status === 'INITIALIZING') {
        return res.json({ status: state.status, message: 'Already connected or initializing' });
    }

    setupAndInitializeClient(shopId);

    res.json({ status: 'INITIALIZING', message: 'Initialization started' });
});

app.get('/api/whatsapp/status', (req, res) => {
    const { shopId } = req.query;
    if (!shopId) return res.status(400).json({ error: 'shopId required' });

    const state = getSessionState(shopId);
    res.json({
        status: state.status,
        qrCodeUrl: state.qrCodeUrl
    });
});

app.post('/api/whatsapp/logout', async (req, res) => {
    const { shopId } = req.body;
    if (!shopId) return res.status(400).json({ error: 'shopId required' });

    const state = getSessionState(shopId);
    if (state.client) {
        try {
            await state.client.logout();
            state.client.destroy();
        } catch (e) {
            console.error(`[${shopId}] Error logging out:`, e);
        }
    }
    state.status = 'DISCONNECTED';
    state.client = null;
    state.qrCodeUrl = null;

    res.json({ success: true });
});

app.post('/api/whatsapp/send', async (req, res) => {
    const { shopId, phone, message } = req.body;

    if (!shopId || !phone || !message) {
        return res.status(400).json({ error: 'shopId, phone, and message are required' });
    }

    const state = getSessionState(shopId);

    if (state.status !== 'CONNECTED' || !state.client) {
        return res.status(400).json({ error: 'WhatsApp client is not connected for this shop' });
    }

    try {
        let phoneStr = phone.replace(/\D/g, '');
        if (phoneStr.startsWith('0')) phoneStr = phoneStr.substring(1);
        if (phoneStr.length === 10) phoneStr = '90' + phoneStr;

        // WhatsApp ID'sini doğrula
        const numberId = await state.client.getNumberId(phoneStr);

        if (!numberId) {
            console.error(`[${shopId}] Phone number ${phoneStr} is not registered on WhatsApp.`);
            return res.status(400).json({ error: 'Bu numara WhatsApp kullanmıyor.' });
        }

        await state.client.sendMessage(numberId._serialized, message);
        console.log(`[${shopId}] Notification sent to ${phone}`);
        res.json({ success: true });
    } catch (error) {
        console.error(`[${shopId}] Error sending notification to ${phone}:`, error);
        res.status(500).json({ error: 'Failed to send message', details: error.message });
    }
});

// --- Cron Job: Appointment Reminders ---
// Her 15 dakikada bir çalışır
cron.schedule('*/15 * * * *', async () => {
    console.log('[CRON] Checking for reminders...');
    try {
        const { data: settings, error: settingsError } = await supabase
            .from('settings')
            .select('shop_id, reminder_hours, shop_name');

        if (settingsError || !settings) {
            console.error('[CRON] Failed to fetch settings:', settingsError);
            return;
        }

        for (const setting of settings) {
            const shopId = setting.shop_id;
            const reminderHours = setting.reminder_hours || 24;

            // Check if WhatsApp client is connected for this shop
            const state = getSessionState(shopId);
            if (state.status !== 'CONNECTED' || !state.client) {
                continue;
            }

            const now = new Date();
            const threshold = addMinutes(now, reminderHours * 60);

            // Fetch appointments using the full view to get customer details
            const { data: appointments, error: aptError } = await supabase
                .from('appointments_full')
                .select('*')
                .eq('shop_id', shopId)
                .eq('status', 'confirmed')
                .eq('reminder_sent', false)
                .gt('scheduled_at', now.toISOString())
                .lte('scheduled_at', threshold.toISOString());

            if (aptError) {
                console.error(`[CRON] [${shopId}] Error fetching appointments:`, aptError);
                continue;
            }

            if (appointments && appointments.length > 0) {
                for (const apt of appointments) {
                    try {
                        let phoneStr = apt.customer_phone;
                        let chatId;

                        if (phoneStr.includes('@')) {
                            // Eğer veritabanına zaten @lid veya @c.us uzantılı kaydedilmişse direkt kullan
                            chatId = phoneStr;
                        } else {
                            if (phoneStr.startsWith('+')) {
                                phoneStr = phoneStr.substring(1);
                            }
                            chatId = `${phoneStr}@c.us`;
                        }

                        const dateObj = new Date(apt.scheduled_at);
                        const dateStr = format(dateObj, 'dd.MM.yyyy HH:mm');

                        const message = `🔔 *Hatırlatma:* Merhaba ${apt.customer_name},\n\n*${setting.shop_name}* için *${dateStr}* tarihindeki *${apt.service_name}* randevunuzu hatırlatmak isteriz. Bizi tercih ettiğiniz için teşekkür ederiz!`;

                        await state.client.sendMessage(chatId, message);
                        console.log(`[CRON] [${shopId}] Reminder sent to ${apt.customer_phone} for appointment ${apt.id}`);

                        // Update DB
                        await supabase
                            .from('appointments')
                            .update({ reminder_sent: true })
                            .eq('id', apt.id);

                    } catch (err) {
                        console.error(`[CRON] [${shopId}] Failed to send reminder to ${apt.customer_phone}:`, err);
                    }
                }
            }
        }
    } catch (e) {
        console.error('[CRON] Unexpected error:', e);
    }
});

async function initializeExistingSessions() {
    const authDir = path.join(__dirname, '.wwebjs_auth');
    if (!fs.existsSync(authDir)) return;

    const files = fs.readdirSync(authDir);
    const sessionPrefix = 'session-';

    console.log('[INIT] Scanning for existing WhatsApp sessions...');

    for (const file of files) {
        if (file.startsWith(sessionPrefix)) {
            const shopId = file.substring(sessionPrefix.length);
            console.log(`[INIT] Found existing session for shop: ${shopId}, starting client...`);
            setupAndInitializeClient(shopId);
            // Chromium'ların aynı anda başlatılıp çökmelerini engellemek için araya gecikme ekliyoruz
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
}

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`BerberBot WhatsApp Microservice running on http://localhost:${PORT}`);
    initializeExistingSessions();
});
