export type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";
export type AppointmentSource = "whatsapp" | "manual";

export interface Shop {
  id: string;
  name: string;
  slug: string;
  owner_id?: string;
  created_at: string;
}

export interface Service {
  id: string;
  shop_id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

export interface Customer {
  id: string;
  shop_id: string;
  name: string;
  phone: string; // E.164 format: +905321234567
  created_at: string;
  total_appointments?: number;
  total_spent?: number;
  last_visit?: string;
  favorite_service?: string;
}

export interface Appointment {
  id: string;
  shop_id: string;
  customer_id: string;
  customer?: Customer;
  service_id: string;
  service?: Service;
  scheduled_at: string; // ISO datetime
  status: AppointmentStatus;
  source: AppointmentSource;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  today_count: number;
  pending_count: number;
  total_customers: number;
  monthly_revenue: number;
  today_appointments: Appointment[];
}

export interface WorkingHour {
  day: number; // 0: Pazar, 1: Pazartesi, ...
  is_open: boolean;
  start: string;
  end: string;
}

export interface Settings {
  id: string;
  shop_id: string;
  shop_name: string;
  whatsapp_number: string | null;
  work_start?: string; // Eskiler için opsiyonel
  work_end?: string;
  work_days?: number[];
  working_hours: WorkingHour[];
  reminder_hours: number;
  auto_confirm: boolean;
  notify_new: boolean;
  notify_cancel: boolean;
  updated_at: string;
}
