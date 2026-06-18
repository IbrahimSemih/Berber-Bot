import { Appointment, Customer, DashboardStats, Service } from "@/types";
import { DEFAULT_SHOP_ID } from "@/lib/supabase";

export const mockServices: Service[] = [
  { id: "1", shop_id: DEFAULT_SHOP_ID, name: "Saç Kesimi", duration_minutes: 30, price: 150 },
  { id: "2", shop_id: DEFAULT_SHOP_ID, name: "Sakal Düzeltme", duration_minutes: 20, price: 80 },
  { id: "3", shop_id: DEFAULT_SHOP_ID, name: "Komple Paket (Saç+Sakal+Ağda)", duration_minutes: 45, price: 250 },
  { id: "4", shop_id: DEFAULT_SHOP_ID, name: "Çocuk Saç Kesimi", duration_minutes: 20, price: 100 },
];

export const mockCustomers: Customer[] = [
  { id: "c1", shop_id: DEFAULT_SHOP_ID, name: "Ahmet Yılmaz", phone: "+905321112233", created_at: "2024-01-10T10:00:00Z", total_appointments: 12, total_spent: 1800, last_visit: "12 Mayıs 2024", favorite_service: "Saç Kesimi" },
  { id: "c2", shop_id: DEFAULT_SHOP_ID, name: "Mehmet Demir", phone: "+905332223344", created_at: "2024-02-15T14:30:00Z", total_appointments: 5, total_spent: 750, last_visit: "05 Haziran 2024", favorite_service: "Saç Kesimi" },
  { id: "c3", shop_id: DEFAULT_SHOP_ID, name: "Can Kaya", phone: "+905343334455", created_at: "2024-03-20T09:15:00Z", total_appointments: 8, total_spent: 2000, last_visit: "28 Mayıs 2024", favorite_service: "Komple Paket" },
  { id: "c4", shop_id: DEFAULT_SHOP_ID, name: "Ali Veli", phone: "+905354445566", created_at: "2024-04-05T16:45:00Z", total_appointments: 2, total_spent: 160, last_visit: "10 Haziran 2024", favorite_service: "Sakal Düzeltme" },
  { id: "c5", shop_id: DEFAULT_SHOP_ID, name: "Hasan Şahin", phone: "+905365556677", created_at: "2024-05-12T11:20:00Z", total_appointments: 1, total_spent: 150, last_visit: "12 Mayıs 2024", favorite_service: "Saç Kesimi" },
  { id: "c6", shop_id: DEFAULT_SHOP_ID, name: "İsimsiz", phone: "+905376667788", created_at: "2024-06-01T13:00:00Z", total_appointments: 1, total_spent: 250, last_visit: "01 Haziran 2024", favorite_service: "Komple Paket" },
  { id: "c7", shop_id: DEFAULT_SHOP_ID, name: "Burak Çelik", phone: "+905387778899", created_at: "2024-06-10T15:10:00Z", total_appointments: 0, total_spent: 0, last_visit: "—", favorite_service: "—" },
];

export const mockAppointments: Appointment[] = [
  // Bugün (varsayalım bugün 18 Haziran)
  { id: "a1", shop_id: DEFAULT_SHOP_ID, customer_id: "c1", customer: mockCustomers[0], service_id: "1", service: mockServices[0], scheduled_at: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(), status: "confirmed", source: "whatsapp", created_at: "2024-06-15T09:00:00Z" },
  { id: "a2", shop_id: DEFAULT_SHOP_ID, customer_id: "c2", customer: mockCustomers[1], service_id: "3", service: mockServices[2], scheduled_at: new Date(new Date().setHours(11, 30, 0, 0)).toISOString(), status: "confirmed", source: "whatsapp", created_at: "2024-06-16T14:20:00Z" },
  { id: "a3", shop_id: DEFAULT_SHOP_ID, customer_id: "c4", customer: mockCustomers[3], service_id: "2", service: mockServices[1], scheduled_at: new Date(new Date().setHours(14, 0, 0, 0)).toISOString(), status: "pending", source: "whatsapp", created_at: "2024-06-18T08:10:00Z" },
  { id: "a4", shop_id: DEFAULT_SHOP_ID, customer_id: "c5", customer: mockCustomers[4], service_id: "1", service: mockServices[0], scheduled_at: new Date(new Date().setHours(15, 30, 0, 0)).toISOString(), status: "confirmed", source: "manual", created_at: "2024-06-18T10:05:00Z" },
  { id: "a5", shop_id: DEFAULT_SHOP_ID, customer_id: "c6", customer: mockCustomers[5], service_id: "3", service: mockServices[2], scheduled_at: new Date(new Date().setHours(17, 0, 0, 0)).toISOString(), status: "pending", source: "whatsapp", created_at: "2024-06-18T11:45:00Z" },
  // Gelecek Randevular
  { id: "a6", shop_id: DEFAULT_SHOP_ID, customer_id: "c3", customer: mockCustomers[2], service_id: "1", service: mockServices[0], scheduled_at: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), status: "confirmed", source: "whatsapp", created_at: "2024-06-17T16:30:00Z" },
  { id: "a7", shop_id: DEFAULT_SHOP_ID, customer_id: "c7", customer: mockCustomers[6], service_id: "4", service: mockServices[3], scheduled_at: new Date(new Date().setDate(new Date().getDate() + 2)).toISOString(), status: "pending", source: "whatsapp", created_at: "2024-06-18T12:00:00Z" },
];

export const MOCK_STATS: DashboardStats = {
  today_count: 7,
  pending_count: 3,
  total_customers: 254,
  monthly_revenue: 12500,
  today_appointments: mockAppointments,
};
