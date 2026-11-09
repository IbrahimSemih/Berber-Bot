// Veri okuma kancaları (React Query). Okumalar kullanıcının oturumuyla doğrudan
// Supabase'den yapılır (RLS); web panelindeki sorgularla aynı tablolar/sütunlar.
import { useQuery } from "@tanstack/react-query";
import { istanbulDayRange } from "@shared/time";
import type { ShopLimitsResponse } from "@shared/api-types";
import { supabase } from "./supabase";
import { apiFetch } from "./api";
import { useAuth } from "./auth";

export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type Appointment = {
  id: string;
  scheduled_at: string;
  status: AppointmentStatus;
  source: string | null;
  staff_id: string | null;
  customer: { id: string; name: string | null; phone: string } | null;
  service: { id: string; name: string; price: number; duration_minutes: number } | null;
  staff: { id: string; name: string } | null;
};

export type Service = { id: string; name: string; duration_minutes: number; price: number; is_active: boolean };
export type Staff = { id: string; name: string; phone: string | null; is_active: boolean; created_at: string };
export type StaffLeave = { id: string; staff_id: string; start_date: string; end_date: string };
export type WorkingHour = { day: number; is_open: boolean; start: string; end: string };
export type Settings = {
  id: string;
  shop_id: string;
  shop_name: string | null;
  whatsapp_number: string | null;
  address?: string | null;
  instagram?: string | null;
  working_hours: WorkingHour[] | null;
  work_start?: string | null;
  work_end?: string | null;
  work_days?: number[] | null;
  reminder_hours: number | null;
  auto_confirm: boolean | null;
  notify_new: boolean | null;
  notify_cancel: boolean | null;
};
export type CustomerRow = {
  id: string;
  name: string | null;
  phone: string;
  created_at: string;
  totalAppointments: number;
  totalSpent: number;
  lastVisit: string | null;
  favoriteService: string | null;
};
export type NotificationRow = { id: string; type: string; message: string; is_read: boolean; created_at: string };

/** Sorgu anahtarları: canlı güncelleme ve yazma sonrası yenileme bu anahtarlarla yapılır */
export const qk = {
  appointments: (shopId: string) => ["appointments", shopId] as const,
  appointmentsDay: (shopId: string, date: string) => ["appointments", shopId, "day", date] as const,
  services: (shopId: string) => ["services", shopId] as const,
  staff: (shopId: string) => ["staff", shopId] as const,
  leaves: (shopId: string, staffId: string) => ["leaves", shopId, staffId] as const,
  settings: (shopId: string) => ["settings", shopId] as const,
  customers: (shopId: string) => ["customers", shopId] as const,
  notifications: (shopId: string) => ["notifications", shopId] as const,
  limits: (shopId: string) => ["limits", shopId] as const,
};

const one = <T,>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

function useShopId(): string {
  const { shop } = useAuth();
  return shop?.id ?? "";
}

export function useDayAppointments(date: string) {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.appointmentsDay(shopId, date),
    enabled: !!shopId,
    queryFn: async () => {
      const { start, end } = istanbulDayRange(date);
      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, scheduled_at, status, source, staff_id, customer:customers(id, name, phone), service:services(id, name, price, duration_minutes), staff:staff(id, name)"
        )
        .eq("shop_id", shopId)
        .gte("scheduled_at", start.toISOString())
        .lt("scheduled_at", end.toISOString())
        .order("scheduled_at");
      if (error) throw error;
      return (data ?? []).map((a: any) => ({
        ...a,
        customer: one(a.customer),
        service: one(a.service),
        staff: one(a.staff),
      })) as Appointment[];
    },
  });
}

export function useServices() {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.services(shopId),
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, duration_minutes, price, is_active")
        .eq("shop_id", shopId)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .order("name", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Service[];
    },
  });
}

export function useStaff() {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.staff(shopId),
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff")
        .select("id, name, phone, is_active, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: true })
        .order("name", { ascending: true }); // aynı anda eklenenler (onboarding) sabit sırada kalsın
      if (error) throw error;
      return (data ?? []) as Staff[];
    },
  });
}

export function useStaffLeaves(staffId: string | null) {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.leaves(shopId, staffId ?? ""),
    enabled: !!shopId && !!staffId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_leaves")
        .select("id, staff_id, start_date, end_date")
        .eq("shop_id", shopId)
        .eq("staff_id", staffId!)
        .order("start_date", { ascending: true });
      if (error) throw error;
      return (data ?? []) as StaffLeave[];
    },
  });
}

export function useSettings() {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.settings(shopId),
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase.from("settings").select("*").eq("shop_id", shopId).limit(1).maybeSingle();
      if (error) throw error;
      return (data as Settings | null) ?? null;
    },
  });
}

/** Müşteriler + randevu istatistikleri (web: app/customers/page.tsx ile aynı hesap) */
export function useCustomers() {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.customers(shopId),
    enabled: !!shopId,
    queryFn: async () => {
      const [customersRes, appointmentsRes] = await Promise.all([
        supabase.from("customers").select("id, name, phone, created_at").eq("shop_id", shopId).order("created_at", { ascending: false }),
        supabase.from("appointments").select("customer_id, status, scheduled_at, service:services(name, price)").eq("shop_id", shopId),
      ]);
      if (customersRes.error) throw customersRes.error;
      if (appointmentsRes.error) throw appointmentsRes.error;

      const now = Date.now();
      const byCustomer = new Map<string, any[]>();
      for (const a of appointmentsRes.data ?? []) {
        if (a.status === "cancelled" || !a.customer_id) continue;
        const list = byCustomer.get(a.customer_id) ?? [];
        list.push(a);
        byCustomer.set(a.customer_id, list);
      }

      return (customersRes.data ?? []).map((c: any): CustomerRow => {
        const apts = byCustomer.get(c.id) ?? [];
        let totalSpent = 0;
        let lastVisitTs = 0;
        const counts: Record<string, number> = {};
        for (const a of apts) {
          const srv = one<any>(a.service);
          if (srv) {
            if (a.status === "completed" || a.status === "confirmed") totalSpent += Number(srv.price || 0);
            counts[srv.name] = (counts[srv.name] ?? 0) + 1;
          }
          const ts = new Date(a.scheduled_at).getTime();
          if (ts < now && ts > lastVisitTs) lastVisitTs = ts;
        }
        const favorite = Object.entries(counts).sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
        return {
          id: c.id,
          name: c.name,
          phone: c.phone,
          created_at: c.created_at,
          totalAppointments: apts.length,
          totalSpent,
          lastVisit: lastVisitTs ? new Date(lastVisitTs).toISOString() : null,
          favoriteService: favorite,
        };
      });
    },
  });
}

export function useNotifications() {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.notifications(shopId),
    enabled: !!shopId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, message, is_read, created_at")
        .eq("shop_id", shopId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as NotificationRow[];
    },
  });
}

export function useShopLimits() {
  const shopId = useShopId();
  return useQuery({
    queryKey: qk.limits(shopId),
    enabled: !!shopId,
    queryFn: () => apiFetch<ShopLimitsResponse>("/shop/limits"),
  });
}

/** Eski kayıtlar (work_days) dahil çalışma saatlerini gün bazlı listeye çevirir. */
export function resolveWorkingHours(settings: Settings | null | undefined): WorkingHour[] {
  const order = [1, 2, 3, 4, 5, 6, 0];
  if (settings && Array.isArray(settings.working_hours) && settings.working_hours.length > 0) {
    return order.map(
      (day) =>
        settings.working_hours!.find((w) => w.day === day) ?? { day, is_open: false, start: "09:00", end: "20:00" }
    );
  }
  const days = settings?.work_days ?? [1, 2, 3, 4, 5, 6];
  const start = (settings?.work_start ?? "09:00").slice(0, 5);
  const end = (settings?.work_end ?? "20:00").slice(0, 5);
  return order.map((day) => ({ day, is_open: days.includes(day), start, end }));
}
