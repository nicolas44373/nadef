import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, TrendingUp, Clock, CheckCircle,
  XCircle, Search, RefreshCw, LogOut, MessageCircle,
  Mail, Globe, DollarSign, Briefcase, Eye, Save, X,
  AlertCircle, Loader2, Check, ChevronUp, ChevronDown
} from 'lucide-react';
import { appointmentService, type Appointment } from '../../services/supabase';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  pending:   { label: 'Pendiente',  color: 'text-amber-600', bg: 'bg-amber-50',  border: 'border-amber-300', icon: Clock },
  confirmed: { label: 'Confirmado', color: 'text-green-600', bg: 'bg-green-50',  border: 'border-green-300', icon: CheckCircle },
  cancelled: { label: 'Cancelado',  color: 'text-red-500',   bg: 'bg-red-50',    border: 'border-red-300',   icon: XCircle },
  completed: { label: 'Completado', color: 'text-blue-600',  bg: 'bg-blue-50',   border: 'border-blue-300',  icon: Check },
} as const;

const INVESTMENT_LABELS: Record<string, string> = {
  '500-1000':  'USD 500 – 1K',
  '1000-2500': 'USD 1K – 2.5K',
  '2500+':     'USD 2.5K+',
};

type StatusKey  = keyof typeof STATUS_CONFIG;
type DateFilter = 'all' | 'today' | 'upcoming' | 'past';
type SortField  = 'date' | 'created' | 'name';

function fmtDate(dateStr: string) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string; value: number | string;
  icon: React.ElementType; color: string; sub?: string;
}
const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color, sub }) => (
  <div className="bg-white border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${color}`}>
      <Icon size={16} className="text-white" />
    </div>
    <p className="text-3xl font-serif text-onyx font-bold leading-none">{value}</p>
    <p className="text-[10px] uppercase tracking-widest text-onyx/40 mt-1">{label}</p>
    {sub && <p className="text-[10px] text-onyx/25 mt-0.5">{sub}</p>}
  </div>
);

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: StatusKey; small?: boolean }> = ({ status, small }) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center space-x-1 font-bold border rounded-full ${cfg.bg} ${cfg.color} ${cfg.border} ${small ? 'px-2 py-0.5 text-[9px]' : 'px-3 py-1 text-[10px]'} uppercase tracking-wider`}>
      <Icon size={small ? 9 : 11} />
      <span>{cfg.label}</span>
    </span>
  );
};

// ─── FILTER CHIP ──────────────────────────────────────────────────────────────
const FilterChip: React.FC<{
  active: boolean; onClick: () => void;
  children: React.ReactNode; variant?: 'default' | 'fuchsia';
}> = ({ active, onClick, children, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold border transition-all rounded-sm ${
      active
        ? variant === 'fuchsia'
          ? 'bg-fuchsia text-white border-fuchsia'
          : 'bg-onyx text-pearl border-onyx'
        : 'bg-white text-onyx/40 border-gray-200 hover:text-onyx hover:border-onyx/30'
    }`}
  >
    {children}
  </button>
);

// ─── SORT BUTTON (fuera del Dashboard para evitar re-renders) ─────────────────
const SortButton: React.FC<{
  field: SortField; currentField: SortField; dir: 'asc' | 'desc';
  label: string; onToggle: (f: SortField) => void;
}> = ({ field, currentField, dir, label, onToggle }) => (
  <button
    onClick={() => onToggle(field)}
    className="flex items-center space-x-1 text-[10px] uppercase tracking-widest font-bold text-onyx/40 hover:text-onyx transition-colors"
  >
    <span>{label}</span>
    {currentField === field
      ? (dir === 'asc' ? <ChevronUp size={12} className="text-fuchsia" /> : <ChevronDown size={12} className="text-fuchsia" />)
      : <ChevronDown size={12} className="opacity-20" />
    }
  </button>
);

// ─── TABLE ROW ────────────────────────────────────────────────────────────────
const AppointmentRow: React.FC<{ apt: Appointment; onClick: () => void }> = ({ apt, onClick }) => (
  <tr
    className="border-b border-gray-50 hover:bg-amber-50/30 cursor-pointer transition-colors group"
    onClick={onClick}
  >
    <td className="py-3.5 px-4">
      <p className="font-semibold text-onyx text-sm group-hover:text-fuchsia transition-colors">{apt.full_name}</p>
      <p className="text-[10px] text-onyx/40 mt-0.5 truncate max-w-[180px]">{apt.email}</p>
    </td>
    <td className="py-3.5 px-4">
      <p className="text-sm text-onyx/80">{fmtDate(apt.appointment_date)}</p>
      <p className="text-[10px] text-onyx/40">{apt.time_slot} hs (Arg)</p>
    </td>
    <td className="py-3.5 px-4">
      <div className="flex items-center gap-2 flex-wrap">
        <StatusBadge status={apt.status} small />
        {apt.date_category === 'today' && (
          <span className="text-[9px] bg-fuchsia text-white px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">HOY</span>
        )}
      </div>
    </td>
    <td className="py-3.5 px-4 text-[11px] text-onyx/50 max-w-[120px] truncate hidden md:table-cell">
      {apt.survey_occupation || <span className="text-onyx/20">—</span>}
    </td>
    <td className="py-3.5 px-4 hidden lg:table-cell">
      {apt.survey_investment_range
        ? <span className="text-[10px] font-bold text-gold bg-gold/10 px-2 py-1 rounded">{INVESTMENT_LABELS[apt.survey_investment_range] || apt.survey_investment_range}</span>
        : <span className="text-onyx/20 text-xs">—</span>
      }
    </td>
    <td className="py-3.5 px-3 text-center">
      <Eye size={14} className="text-onyx/15 group-hover:text-fuchsia transition-colors mx-auto" />
    </td>
  </tr>
);

// ─── APPOINTMENT MODAL ────────────────────────────────────────────────────────
interface ModalProps {
  appointment: Appointment;
  onClose: () => void;
  onStatusChange: (id: string, status: StatusKey, reason?: string) => Promise<void>;
  onNoteSave: (id: string, notes: string) => Promise<void>;
}

const AppointmentModal: React.FC<ModalProps> = ({ appointment: apt, onClose, onStatusChange, onNoteSave }) => {
  const [notes, setNotes]                   = useState(apt.admin_notes || '');
  const [savingNotes, setSavingNotes]       = useState(false);
  const [noteSaved, setNoteSaved]           = useState(false);
  const [changingStatus, setChangingStatus] = useState<StatusKey | null>(null);
  const [cancelReason, setCancelReason]     = useState('');
  const [showCancelBox, setShowCancelBox]   = useState(false);
  const [statusError, setStatusError]       = useState<string | null>(null);

  const handleSaveNotes = async () => {
    setSavingNotes(true);
    try {
      await onNoteSave(apt.id, notes);
      setNoteSaved(true);
      setTimeout(() => setNoteSaved(false), 2500);
    } catch {
      alert('No se pudieron guardar las notas.');
    } finally {
      setSavingNotes(false);
    }
  };

  const doStatusChange = async (status: StatusKey, reason?: string) => {
    setChangingStatus(status);
    setStatusError(null);
    try {
      await onStatusChange(apt.id, status, reason);
      onClose();
    } catch (err) {
      console.error('Status change error:', err);
      setStatusError('Error al cambiar estado. Ejecutá el SQL de fix_rls_policies.sql en Supabase.');
    } finally {
      setChangingStatus(null);
    }
  };

  const handleStatusClick = async (status: StatusKey) => {
    if (status === apt.status) return;
    if (status === 'cancelled') { setShowCancelBox(true); return; }
    await doStatusChange(status);
  };

  const whatsappUrl = `https://wa.me/${apt.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
    `Hola ${apt.first_name}! Te confirmamos tu sesión de diagnóstico el ${fmtDate(apt.appointment_date)} a las ${apt.time_slot} hs (Argentina). ¡Nos vemos pronto!`
  )}`;

  const mailUrl = `mailto:${apt.email}?subject=${encodeURIComponent(`Sesión confirmada · ${fmtDate(apt.appointment_date)}`)}&body=${encodeURIComponent(
    `Hola ${apt.first_name},\n\nTe confirmamos tu sesión para el ${fmtDate(apt.appointment_date)} a las ${apt.time_slot} hs (Argentina).\n\nTe enviaremos el link de la sesión 24hs antes.\n\n¡Hasta pronto!`
  )}`;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="bg-white w-full max-w-3xl shadow-2xl max-h-[92vh] overflow-y-auto rounded-sm"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-onyx text-pearl p-6 flex justify-between items-start sticky top-0 z-10">
          <div>
            <p className="text-fuchsia text-[9px] uppercase tracking-[0.5em] mb-1">Turno #{apt.id.slice(0, 8)}</p>
            <h2 className="text-2xl font-serif">{apt.full_name}</h2>
            <p className="text-pearl/50 text-sm mt-1">{fmtDate(apt.appointment_date)} · {apt.time_slot} hs (Arg)</p>
          </div>
          <div className="flex items-center space-x-3 mt-1">
            <StatusBadge status={apt.status} />
            <button onClick={onClose} className="text-pearl/30 hover:text-pearl transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 md:divide-x divide-gray-100">
          {/* ── IZQUIERDA: info cliente ── */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-onyx/30 mb-3">Contacto</h3>
              <div className="space-y-2.5">
                <a href={`mailto:${apt.email}`} className="flex items-center space-x-3 group">
                  <Mail size={14} className="text-onyx/25 group-hover:text-fuchsia transition-colors flex-shrink-0" />
                  <span className="text-sm group-hover:text-fuchsia transition-colors">{apt.email}</span>
                </a>
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 group">
                  <MessageCircle size={14} className="text-green-500 flex-shrink-0" />
                  <span className="text-sm text-green-600 group-hover:text-green-700 font-semibold">{apt.whatsapp} ↗</span>
                </a>
                {apt.client_timezone && (
                  <div className="flex items-center space-x-3">
                    <Globe size={14} className="text-onyx/25 flex-shrink-0" />
                    <span className="text-xs text-onyx/50">{apt.client_timezone} · {apt.client_utc_offset}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-onyx/30 mb-3">Perfil / Encuesta</h3>
              <div className="space-y-4">
                {apt.survey_occupation && (
                  <div className="flex items-start space-x-2">
                    <Briefcase size={13} className="text-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-onyx/30 mb-0.5">Ocupación</p>
                      <p className="text-sm text-onyx">{apt.survey_occupation}</p>
                    </div>
                  </div>
                )}
                {apt.survey_environments && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-onyx/30 mb-1">Entornos</p>
                    <p className="text-sm text-onyx">{apt.survey_environments}</p>
                  </div>
                )}
                {apt.survey_frustrations && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-onyx/30 mb-1">Frustraciones</p>
                    <p className="text-sm text-onyx bg-red-50 border-l-2 border-red-200 p-3 leading-relaxed">{apt.survey_frustrations}</p>
                  </div>
                )}
                {apt.survey_image_desire && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-onyx/30 mb-1">Imagen deseada</p>
                    <p className="text-sm text-onyx">{apt.survey_image_desire}</p>
                  </div>
                )}
                {apt.survey_why_now && (
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-onyx/30 mb-1">¿Por qué ahora?</p>
                    <p className="text-sm text-onyx">{apt.survey_why_now}</p>
                  </div>
                )}
                {apt.survey_investment_range && (
                  <div className="flex items-center space-x-3 bg-gold/5 border border-gold/20 p-3">
                    <DollarSign size={18} className="text-gold flex-shrink-0" />
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-onyx/30">Inversión proyectada</p>
                      <p className="text-base font-bold text-gold">{INVESTMENT_LABELS[apt.survey_investment_range] || apt.survey_investment_range}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] text-onyx/25 space-y-1 border-t border-gray-50 pt-4">
              <p>Creado: {new Date(apt.created_at).toLocaleString('es-ES')}</p>
              {apt.confirmed_at && <p>Confirmado: {new Date(apt.confirmed_at).toLocaleString('es-ES')}</p>}
              {apt.cancelled_at && <p>Cancelado: {new Date(apt.cancelled_at).toLocaleString('es-ES')}{apt.cancellation_reason ? ` — ${apt.cancellation_reason}` : ''}</p>}
            </div>
          </div>

          {/* ── DERECHA: acciones ── */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-onyx/30 mb-3">Cambiar estado</h3>

              {statusError && (
                <div className="flex items-start space-x-2 bg-red-50 border border-red-200 p-3 mb-3 rounded-sm">
                  <AlertCircle size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-600">{statusError}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(s => {
                  const cfg = STATUS_CONFIG[s];
                  const Icon = cfg.icon;
                  const isActive  = apt.status === s;
                  const isLoading = changingStatus === s;
                  return (
                    <button
                      key={s}
                      onClick={() => handleStatusClick(s)}
                      disabled={isActive || changingStatus !== null}
                      className={`py-3 px-3 border text-[10px] uppercase tracking-wider font-bold flex items-center justify-center space-x-1.5 transition-all rounded-sm disabled:opacity-60 ${
                        isActive
                          ? `${cfg.bg} ${cfg.color} ${cfg.border} cursor-default`
                          : 'bg-white border-gray-200 text-onyx/50 hover:border-onyx hover:text-onyx cursor-pointer'
                      }`}
                    >
                      {isLoading ? <Loader2 size={11} className="animate-spin" /> : <Icon size={11} />}
                      <span>{cfg.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence>
                {showCancelBox && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 overflow-hidden"
                  >
                    <div className="bg-red-50 border border-red-200 p-3 space-y-2 rounded-sm">
                      <p className="text-[10px] uppercase tracking-widest text-red-500 font-bold">Motivo (opcional)</p>
                      <input
                        type="text"
                        placeholder="Ej: Cliente reprogramó..."
                        className="w-full border border-red-200 bg-white p-2 text-sm outline-none focus:border-red-400 rounded-sm"
                        value={cancelReason}
                        onChange={e => setCancelReason(e.target.value)}
                        autoFocus
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => doStatusChange('cancelled', cancelReason)}
                          disabled={changingStatus !== null}
                          className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 text-xs uppercase tracking-widest font-bold transition-colors flex items-center justify-center space-x-1"
                        >
                          {changingStatus === 'cancelled' ? <Loader2 size={12} className="animate-spin" /> : null}
                          <span>Confirmar cancelación</span>
                        </button>
                        <button
                          onClick={() => { setShowCancelBox(false); setCancelReason(''); }}
                          className="px-4 border border-gray-200 text-xs text-onyx/50 hover:text-onyx"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-onyx/30 mb-3">Acciones rápidas</h3>
              <div className="space-y-2">
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center space-x-3 p-3 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 transition-colors text-xs font-bold uppercase tracking-wider rounded-sm"
                >
                  <MessageCircle size={14} /><span>Abrir WhatsApp</span>
                </a>
                <a href={mailUrl}
                  className="flex items-center space-x-3 p-3 border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-xs font-bold uppercase tracking-wider rounded-sm"
                >
                  <Mail size={14} /><span>Enviar email</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-onyx/30 mb-3">Notas internas</h3>
              <textarea
                rows={5}
                placeholder="Notas privadas sobre este cliente..."
                className="w-full border border-gray-200 p-3 text-sm outline-none focus:border-fuchsia resize-none transition-colors"
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
              <button
                onClick={handleSaveNotes}
                disabled={savingNotes}
                className={`mt-2 w-full py-2.5 text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center space-x-2 disabled:opacity-50 ${
                  noteSaved ? 'bg-green-500 text-white' : 'bg-onyx text-pearl hover:bg-fuchsia'
                }`}
              >
                {savingNotes
                  ? <><Loader2 size={12} className="animate-spin" /><span>Guardando...</span></>
                  : noteSaved
                  ? <><Check size={12} /><span>Guardado</span></>
                  : <><Save size={12} /><span>Guardar notas</span></>
                }
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export const Dashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [refreshing, setRefreshing]     = useState(false);
  const [selectedApt, setSelectedApt]   = useState<Appointment | null>(null);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusKey | 'all'>('all');
  const [dateFilter, setDateFilter]     = useState<DateFilter>('all');
  const [sortField, setSortField]       = useState<SortField>('date');
  const [sortDir, setSortDir]           = useState<'asc' | 'desc'>('asc');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const data = await appointmentService.getAllForAdmin();
      setAppointments(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('No se pudieron cargar los turnos. Revisá los permisos en Supabase.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh cada 60s
  useEffect(() => {
    const t = setInterval(() => fetchData(true), 60_000);
    return () => clearInterval(t);
  }, [fetchData]);

  // Sync modal cuando cambia la lista
  useEffect(() => {
    if (selectedApt) {
      const updated = appointments.find(a => a.id === selectedApt.id);
      if (updated) setSelectedApt(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointments]);

  const handleStatusChange = useCallback(async (id: string, status: StatusKey, reason?: string) => {
    await appointmentService.updateStatus(id, status, reason);
    // Actualización optimista
    setAppointments(prev => prev.map(a => a.id === id ? {
      ...a, status,
      confirmed_at: status === 'confirmed' ? new Date().toISOString() : a.confirmed_at,
      cancelled_at: status === 'cancelled' ? new Date().toISOString() : a.cancelled_at,
      cancellation_reason: status === 'cancelled' ? (reason || null) : a.cancellation_reason,
    } : a));
    setTimeout(() => fetchData(true), 800);
  }, [fetchData]);

  const handleNoteSave = useCallback(async (id: string, notes: string) => {
    await appointmentService.saveNotes(id, notes);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, admin_notes: notes } : a));
  }, []);

  const toggleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  }, [sortField]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return appointments
      .filter(a => {
        if (q) {
          const hay = [a.full_name, a.email, a.whatsapp, a.survey_occupation || ''].join(' ').toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (statusFilter !== 'all' && a.status !== statusFilter) return false;
        if (dateFilter !== 'all' && a.date_category !== dateFilter) return false;
        return true;
      })
      .sort((a, b) => {
        let cmp = 0;
        if (sortField === 'date')    cmp = a.appointment_date.localeCompare(b.appointment_date) || a.time_slot.localeCompare(b.time_slot);
        if (sortField === 'created') cmp = a.created_at.localeCompare(b.created_at);
        if (sortField === 'name')    cmp = a.full_name.localeCompare(b.full_name, 'es');
        return sortDir === 'asc' ? cmp : -cmp;
      });
  }, [appointments, search, statusFilter, dateFilter, sortField, sortDir]);

  const stats = useMemo(() => ({
    total:     appointments.length,
    pending:   appointments.filter(a => a.status === 'pending').length,
    confirmed: appointments.filter(a => a.status === 'confirmed').length,
    today:     appointments.filter(a => a.date_category === 'today'    && a.status !== 'cancelled').length,
    upcoming:  appointments.filter(a => a.date_category === 'upcoming' && a.status !== 'cancelled').length,
    highValue: appointments.filter(a => a.survey_investment_range === '2500+').length,
  }), [appointments]);

  const clearFilters = () => { setSearch(''); setStatusFilter('all'); setDateFilter('all'); };
  const hasFilters = search || statusFilter !== 'all' || dateFilter !== 'all';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAV */}
      <div className="bg-onyx text-pearl px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div>
          <p className="text-fuchsia text-[9px] uppercase tracking-[0.5em]">Panel de Control</p>
          <h1 className="font-serif text-lg mt-0.5">María Emilia Nadef</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => fetchData(true)} disabled={refreshing} className="text-pearl/30 hover:text-pearl transition-colors" title="Actualizar">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={onLogout} className="flex items-center space-x-2 text-pearl/30 hover:text-pearl transition-colors text-xs uppercase tracking-widest">
            <LogOut size={14} /><span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-5">
        {/* ERROR */}
        {error && (
          <div className="flex items-start space-x-3 bg-red-50 border border-red-200 p-4">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-red-700 font-medium">{error}</p>
              <button onClick={() => fetchData()} className="text-xs underline text-red-400 mt-1">Reintentar</button>
            </div>
          </div>
        )}

        {/* STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Total"       value={stats.total}     icon={Users}       color="bg-onyx" />
          <StatCard label="Pendientes"  value={stats.pending}   icon={Clock}       color="bg-amber-500" />
          <StatCard label="Confirmados" value={stats.confirmed} icon={CheckCircle} color="bg-green-500" />
          <StatCard label="Hoy"         value={stats.today}     icon={Calendar}    color="bg-fuchsia" />
          <StatCard label="Próximos"    value={stats.upcoming}  icon={TrendingUp}  color="bg-blue-500" />
          <StatCard label="Alta inv."   value={stats.highValue} icon={DollarSign}  color="bg-yellow-500" sub="USD 2.5K+" />
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-onyx/25" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o WhatsApp..."
              className="w-full pl-9 pr-9 py-2.5 border border-gray-200 text-sm outline-none focus:border-fuchsia transition-colors"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-onyx/30 hover:text-onyx">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-[9px] uppercase tracking-widest text-onyx/25 font-bold">Estado:</span>
            <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Todos</FilterChip>
            {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(s => (
              <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)}>
                {STATUS_CONFIG[s].label}
              </FilterChip>
            ))}

            <span className="text-[9px] uppercase tracking-widest text-onyx/25 font-bold ml-2">Fecha:</span>
            {([['all', 'Todas'], ['today', 'Hoy'], ['upcoming', 'Próximos'], ['past', 'Pasados']] as [DateFilter, string][]).map(([val, lbl]) => (
              <FilterChip key={val} active={dateFilter === val} onClick={() => setDateFilter(val)} variant="fuchsia">{lbl}</FilterChip>
            ))}

            <div className="ml-auto flex items-center space-x-3">
              {hasFilters && (
                <button onClick={clearFilters} className="text-[10px] text-fuchsia underline hover:text-onyx transition-colors">
                  Limpiar filtros
                </button>
              )}
              <span className="text-[10px] text-onyx/25">
                {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-24 space-x-3 text-onyx/30">
              <Loader2 size={28} className="animate-spin" />
              <span className="text-sm">Cargando turnos...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-onyx/25">
              <Calendar size={36} className="mx-auto mb-4 opacity-30" />
              <p className="text-sm font-medium">No hay resultados</p>
              <p className="text-xs mt-1">{hasFilters ? 'Probá con otros filtros' : 'Aún no hay turnos agendados'}</p>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-4 text-xs text-fuchsia underline">Limpiar filtros</button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th className="text-left py-3 px-4">
                      <SortButton field="name" currentField={sortField} dir={sortDir} label="Cliente" onToggle={toggleSort} />
                    </th>
                    <th className="text-left py-3 px-4">
                      <SortButton field="date" currentField={sortField} dir={sortDir} label="Fecha / Hora" onToggle={toggleSort} />
                    </th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest font-bold text-onyx/30">Estado</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest font-bold text-onyx/30 hidden md:table-cell">Ocupación</th>
                    <th className="text-left py-3 px-4 text-[10px] uppercase tracking-widest font-bold text-onyx/30 hidden lg:table-cell">Inversión</th>
                    <th className="py-3 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(apt => (
                    <AppointmentRow key={apt.id} apt={apt} onClick={() => setSelectedApt(apt)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-[9px] uppercase tracking-widest text-onyx/15 pb-4">
          Panel Admin · María Emilia Nadef · {new Date().getFullYear()}
        </p>
      </div>

      <AnimatePresence>
        {selectedApt && (
          <AppointmentModal
            appointment={selectedApt}
            onClose={() => setSelectedApt(null)}
            onStatusChange={handleStatusChange}
            onNoteSave={handleNoteSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};