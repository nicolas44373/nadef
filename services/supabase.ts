// services/supabase.ts
// Instalar: npm install @supabase/supabase-js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AppointmentInsert {
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string;
  appointment_date: string;       // 'YYYY-MM-DD'
  time_slot: string;              // 'HH:MM' en hora Buenos Aires
  appointment_utc: string;        // ISO string UTC
  client_timezone: string;        // Ej: 'America/New_York'
  client_utc_offset: string;      // Ej: '-05:00'
  survey_occupation?: string;
  survey_environments?: string;
  survey_frustrations?: string;
  survey_image_desire?: string;
  survey_why_now?: string;
  survey_investment_range?: string;
}

export interface Appointment {
  id: string;
  created_at: string;
  full_name: string;
  first_name: string;
  last_name: string;
  email: string;
  whatsapp: string;
  appointment_date: string;
  time_slot: string;
  appointment_utc: string;
  client_timezone: string;
  client_utc_offset: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  survey_occupation: string | null;
  survey_environments: string | null;
  survey_frustrations: string | null;
  survey_image_desire: string | null;
  survey_why_now: string | null;
  survey_investment_range: string | null;
  admin_notes: string | null;
  confirmed_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: string | null;
  date_category: 'past' | 'today' | 'upcoming';
  days_until: number;
}

export interface SlotAvailability {
  time_slot: string;
  is_available: boolean;
}

// ─── APPOINTMENT SERVICE ──────────────────────────────────────────────────────

export const appointmentService = {

  /** Crea un nuevo turno */
  async create(data: AppointmentInsert): Promise<{ id: string }> {
    const { data: result, error } = await supabase
      .from('appointments')
      .insert([data])
      .select('id')
      .single();

    if (error) throw error;
    return result;
  },

  /** Obtiene los slots disponibles para una fecha (usando la función SQL) */
  async getAvailableSlots(date: string): Promise<SlotAvailability[]> {
    const { data, error } = await supabase
      .rpc('get_available_slots', { p_date: date });

    if (error) throw error;
    return data || [];
  },

  /** Obtiene todos los turnos para el admin (vista completa) */
  async getAllForAdmin(): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('admin_appointments_view')
      .select('*')
      .order('appointment_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /** Actualiza el estado de un turno */
  async updateStatus(
    id: string, 
    status: Appointment['status'], 
    reason?: string
  ): Promise<void> {
    const updates: Record<string, unknown> = { status };
    if (status === 'confirmed') updates.confirmed_at = new Date().toISOString();
    if (status === 'cancelled') {
      updates.cancelled_at = new Date().toISOString();
      updates.cancellation_reason = reason || null;
    }

    const { error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  /** Guarda notas del admin */
  async saveNotes(id: string, notes: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .update({ admin_notes: notes })
      .eq('id', id);

    if (error) throw error;
  },

  /** Obtiene estadísticas del dashboard */
  async getStats(): Promise<Record<string, unknown>> {
    const { data, error } = await supabase.rpc('get_dashboard_stats');
    if (error) throw error;
    return data;
  },
};

// ─── BLOCKED SLOTS SERVICE ────────────────────────────────────────────────────

export const blockedSlotsService = {

  async block(date: string, timeSlot: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from('blocked_slots')
      .insert([{ slot_date: date, time_slot: timeSlot, reason }]);
    if (error) throw error;
  },

  async unblock(date: string, timeSlot: string): Promise<void> {
    const { error } = await supabase
      .from('blocked_slots')
      .delete()
      .eq('slot_date', date)
      .eq('time_slot', timeSlot);
    if (error) throw error;
  },
};