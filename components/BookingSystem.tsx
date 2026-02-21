import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar as CalendarIcon, Clock, ClipboardList, Contact,
  CheckCircle2, ChevronLeft, X, Globe, AlertCircle, Loader2
} from 'lucide-react';
import { appointmentService, type AppointmentInsert, type SlotAvailability } from '../services/supabase';

interface BookingSystemProps {
  onClose: () => void;
}

type Step = 'date' | 'time' | 'survey' | 'contact' | 'success';

// Zona horaria base del negocio (siempre Argentina)
const BUSINESS_TZ = 'America/Argentina/Buenos_Aires';

// Genera los próximos N días hábiles disponibles (lun-sáb)
function getAvailableDates(daysAhead = 21): string[] {
  const dates: string[] = [];
  const now = new Date();
  let cursor = new Date(now);
  cursor.setDate(cursor.getDate() + 1); // empieza mañana

  while (dates.length < daysAhead) {
    const dayOfWeek = cursor.getDay(); // 0=Dom, 6=Sáb
    if (dayOfWeek !== 0) { // Excluir domingos
      dates.push(cursor.toISOString().split('T')[0]);
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

// Convierte 'HH:MM' Argentina a UTC ISO string para una fecha dada
function argTimeToUTC(dateStr: string, timeSlot: string): string {
  // Obtenemos el offset de Argentina (-03:00)
  const [h, m] = timeSlot.split(':').map(Number);
  // Argentina es UTC-3
  const argDate = new Date(`${dateStr}T${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:00-03:00`);
  return argDate.toISOString();
}

// Convierte un ISO UTC a hora local del cliente
function utcToLocal(utcStr: string, tz: string): string {
  return new Date(utcStr).toLocaleTimeString('es-ES', {
    hour: '2-digit', minute: '2-digit', timeZone: tz
  });
}

// Obtiene el UTC offset como string (+HH:MM)
function getUTCOffset(tz: string): string {
  const date = new Date();
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: tz,
    timeZoneName: 'shortOffset'
  });
  const parts = formatter.formatToParts(date);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  return offsetPart?.value?.replace('GMT', '') || '+00:00';
}

// Slot cards con soporte de timezone
interface SlotCardProps {
  slot: string;
  isAvailable: boolean;
  isPast: boolean;
  isSelected: boolean;
  clientTz: string;
  onSelect: (slot: string) => void;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, isAvailable, isPast, isSelected, clientTz, onSelect }) => {
  const disabled = !isAvailable || isPast;
  const utcStr = argTimeToUTC(new Date().toISOString().split('T')[0], slot);
  const localTime = clientTz !== BUSINESS_TZ ? utcToLocal(utcStr, clientTz) : null;
  const showLocalTime = localTime && localTime !== slot;

  return (
    <button
      disabled={disabled}
      onClick={() => !disabled && onSelect(slot)}
      title={!isAvailable ? 'Ya reservado' : isPast ? 'Horario pasado' : 'Disponible'}
      className={`
        relative p-4 border text-center transition-all flex flex-col items-center justify-center
        ${isSelected ? 'bg-fuchsia text-white border-fuchsia shadow-lg' : ''}
        ${disabled
          ? 'bg-gray-50 border-gray-100 cursor-not-allowed opacity-50'
          : !isSelected ? 'bg-white hover:border-gold border-gray-200 cursor-pointer' : ''}
      `}
    >
      {!isAvailable && !isPast && (
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full" title="Ocupado" />
      )}
      <Clock className={`mb-1.5 ${isSelected ? 'text-white' : 'text-onyx/40'}`} size={14} />
      <span className={`font-bold tracking-widest text-sm ${isSelected ? 'text-white' : disabled ? 'text-gray-400' : 'text-onyx'}`}>
        {slot}
      </span>
      <span className={`text-[9px] mt-0.5 ${isSelected ? 'text-white/70' : 'text-onyx/40'}`}>
        Arg
      </span>
      {showLocalTime && (
        <span className={`text-[9px] mt-0.5 font-semibold ${isSelected ? 'text-white/90' : 'text-gold'}`}>
          {localTime} local
        </span>
      )}
      {isPast && (
        <span className="text-[9px] text-red-400 mt-0.5">Pasado</span>
      )}
      {!isAvailable && !isPast && (
        <span className="text-[9px] text-red-400 mt-0.5">Ocupado</span>
      )}
    </button>
  );
};

export const BookingSystem: React.FC<BookingSystemProps> = ({ onClose }) => {
  const [step, setStep] = useState<Step>('date');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<SlotAvailability[]>([]);
  const [clientTimezone, setClientTimezone] = useState<string>(BUSINESS_TZ);
  const [availableDates] = useState<string[]>(getAvailableDates(21));

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    survey: {
      occupation: '',
      environments: '',
      frustrations: '',
      imageDesire: '',
      whyNow: '',
      investmentRange: ''
    },
    contact: {
      firstName: '',
      lastName: '',
      email: '',
      whatsapp: ''
    }
  });

  // Detectar timezone del cliente
  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setClientTimezone(tz || BUSINESS_TZ);
    } catch {
      setClientTimezone(BUSINESS_TZ);
    }
  }, []);

  // Cargar slots al seleccionar fecha
  const loadSlots = useCallback(async (date: string) => {
    setSlotsLoading(true);
    setSlotsError(null);
    try {
      const slots = await appointmentService.getAvailableSlots(date);
      setAvailableSlots(slots);
    } catch (err) {
      console.error(err);
      setSlotsError('No se pudieron cargar los horarios. Por favor intentá de nuevo.');
    } finally {
      setSlotsLoading(false);
    }
  }, []);

  const steps: { key: Step; label: string; icon: React.ElementType }[] = [
    { key: 'date', label: 'Día', icon: CalendarIcon },
    { key: 'time', label: 'Hora', icon: Clock },
    { key: 'survey', label: 'Perfil', icon: ClipboardList },
    { key: 'contact', label: 'Contacto', icon: Contact },
    { key: 'success', label: 'Listo', icon: CheckCircle2 },
  ];

  const sequence: Step[] = ['date', 'time', 'survey', 'contact', 'success'];

  const handleNext = () => {
    const nextIndex = sequence.indexOf(step) + 1;
    if (nextIndex < sequence.length) setStep(sequence[nextIndex]);
  };

  const handleBack = () => {
    const prevIndex = sequence.indexOf(step) - 1;
    if (prevIndex >= 0) setStep(sequence[prevIndex]);
  };

  const handleSelectDate = (date: string) => {
    setFormData(prev => ({ ...prev, date, time: '' }));
    loadSlots(date);
    handleNext();
  };

  const handleSelectTime = (slot: string) => {
    setFormData(prev => ({ ...prev, time: slot }));
    handleNext();
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const utcOffset = getUTCOffset(clientTimezone);
      const appointmentUtc = argTimeToUTC(formData.date, formData.time);

      const payload: AppointmentInsert = {
        first_name: formData.contact.firstName,
        last_name: formData.contact.lastName,
        email: formData.contact.email,
        whatsapp: formData.contact.whatsapp,
        appointment_date: formData.date,
        time_slot: formData.time,
        appointment_utc: appointmentUtc,
        client_timezone: clientTimezone,
        client_utc_offset: utcOffset,
        survey_occupation: formData.survey.occupation,
        survey_environments: formData.survey.environments,
        survey_frustrations: formData.survey.frustrations,
        survey_image_desire: formData.survey.imageDesire,
        survey_why_now: formData.survey.whyNow,
        survey_investment_range: formData.survey.investmentRange,
      };

      await appointmentService.create(payload);
      setStep('success');
    } catch {
      alert('Error al agendar. Por favor intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // ─── STEP: DATE ───────────────────────────────────────────────────────────────
  const renderDateStep = () => {
    const months: Record<string, string[]> = {};
    availableDates.forEach(date => {
      const monthKey = new Date(date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(date);
    });

    return (
      <div className="space-y-8 max-h-[55vh] overflow-y-auto pr-2">
        {Object.entries(months).map(([month, dates]) => (
          <div key={month}>
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-onyx/40 mb-4 font-bold capitalize">{month}</h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {dates.map(date => {
                const d = new Date(date + 'T12:00:00');
                const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
                const dayNum = d.getDate();
                const isSelected = formData.date === date;
                const isSat = d.getDay() === 6;

                return (
                  <button
                    key={date}
                    onClick={() => handleSelectDate(date)}
                    className={`
                      p-3 border text-center transition-all
                      ${isSelected ? 'bg-fuchsia text-white border-fuchsia shadow-lg' : ''}
                      ${isSat && !isSelected ? 'border-gold/30 bg-gold/5' : ''}
                      ${!isSelected ? 'bg-white hover:border-gold border-gray-200' : ''}
                    `}
                  >
                    <div className={`text-[10px] uppercase font-bold ${isSelected ? 'text-white/70' : isSat ? 'text-gold' : 'text-onyx/50'}`}>
                      {dayName}
                    </div>
                    <div className={`text-2xl font-serif mt-1 ${isSelected ? 'text-white' : 'text-onyx'}`}>
                      {dayNum}
                    </div>
                    {isSat && !isSelected && (
                      <div className="text-[8px] uppercase tracking-wider text-gold mt-0.5">Sáb</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── STEP: TIME ───────────────────────────────────────────────────────────────
  const renderTimeStep = () => {
    // Determinar cuáles son "pasadas" si la fecha es hoy
    const selectedDate = formData.date;
    const isToday = selectedDate === new Date().toISOString().split('T')[0];
    const nowArgHour = isToday
      ? parseInt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', hour12: false, timeZone: BUSINESS_TZ }))
      : -1;

    const isLocalDifferent = clientTimezone !== BUSINESS_TZ;

    return (
      <div className="space-y-6">
        {isLocalDifferent && (
          <div className="flex items-start space-x-3 bg-gold/10 border border-gold/20 p-4">
            <Globe size={16} className="text-gold mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold text-onyx mb-1">Zona horaria detectada</p>
              <p className="text-xs text-onyx/60">
                Los horarios son en <strong>Argentina (UTC-3)</strong>. 
                Tu hora local ({clientTimezone}) se muestra debajo de cada slot.
              </p>
            </div>
          </div>
        )}

        {slotsLoading ? (
          <div className="flex items-center justify-center py-16 text-onyx/40">
            <Loader2 size={32} className="animate-spin mr-3" />
            <span className="text-sm">Verificando disponibilidad...</span>
          </div>
        ) : slotsError ? (
          <div className="flex items-start space-x-3 bg-red-50 border border-red-100 p-4">
            <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-red-600">{slotsError}</p>
              <button
                onClick={() => loadSlots(formData.date)}
                className="text-xs underline text-red-500 mt-1"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {availableSlots.map(({ time_slot, is_available }) => {
                const slotHour = parseInt(time_slot.split(':')[0]);
                const isPast = isToday && slotHour <= nowArgHour;
                return (
                  <SlotCard
                    key={time_slot}
                    slot={time_slot}
                    isAvailable={is_available}
                    isPast={isPast}
                    isSelected={formData.time === time_slot}
                    clientTz={clientTimezone}
                    onSelect={handleSelectTime}
                  />
                );
              })}
            </div>
            <div className="flex items-center space-x-6 text-[10px] text-onyx/40 pt-2">
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span>Disponible</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span>Ocupado</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>No disponible</span>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // ─── STEP: SURVEY ─────────────────────────────────────────────────────────────
  const renderSurveyStep = () => (
    <div className="space-y-6 max-h-[55vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-onyx/60 mb-2">
            Ocupación / Cargo *
          </label>
          <input
            type="text"
            placeholder="CEO, Directora, Profesional..."
            className="w-full border-b border-gray-300 py-2 focus:border-fuchsia outline-none bg-transparent text-sm"
            value={formData.survey.occupation}
            onChange={e => setFormData(p => ({ ...p, survey: { ...p.survey, occupation: e.target.value } }))}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-onyx/60 mb-2">
            Entornos prioritarios
          </label>
          <input
            type="text"
            placeholder="Directorio, Eventos Sociales, Media..."
            className="w-full border-b border-gray-300 py-2 focus:border-fuchsia outline-none bg-transparent text-sm"
            value={formData.survey.environments}
            onChange={e => setFormData(p => ({ ...p, survey: { ...p.survey, environments: e.target.value } }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-onyx/60 mb-2">
          Frustraciones actuales con tu imagen *
        </label>
        <textarea
          rows={3}
          placeholder="Contame qué no te gusta o qué sentís que no funciona..."
          className="w-full border border-gray-200 p-4 focus:border-fuchsia outline-none bg-white text-sm resize-none"
          value={formData.survey.frustrations}
          onChange={e => setFormData(p => ({ ...p, survey: { ...p.survey, frustrations: e.target.value } }))}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-onyx/60 mb-2">
            Imagen ideal / deseo de imagen
          </label>
          <input
            type="text"
            placeholder="Cómo querés que te perciban..."
            className="w-full border-b border-gray-300 py-2 focus:border-fuchsia outline-none bg-transparent text-sm"
            value={formData.survey.imageDesire}
            onChange={e => setFormData(p => ({ ...p, survey: { ...p.survey, imageDesire: e.target.value } }))}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-onyx/60 mb-2">
            ¿Por qué ahora?
          </label>
          <input
            type="text"
            placeholder="Un cambio, evento, transición..."
            className="w-full border-b border-gray-300 py-2 focus:border-fuchsia outline-none bg-transparent text-sm"
            value={formData.survey.whyNow}
            onChange={e => setFormData(p => ({ ...p, survey: { ...p.survey, whyNow: e.target.value } }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-[0.2em] text-onyx/60 mb-2">
          Inversión proyectada para tu imagen
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: '500-1000', label: 'USD 500 – 1K' },
            { value: '1000-2500', label: 'USD 1K – 2.5K' },
            { value: '2500+', label: 'USD 2.5K+' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFormData(p => ({ ...p, survey: { ...p.survey, investmentRange: opt.value } }))}
              className={`py-3 border text-center text-[10px] uppercase tracking-wider font-bold transition-all ${
                formData.survey.investmentRange === opt.value
                  ? 'bg-onyx text-pearl border-onyx'
                  : 'bg-white border-gray-200 text-onyx hover:border-gold'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleNext}
        disabled={!formData.survey.occupation || !formData.survey.frustrations}
        className="w-full bg-onyx text-pearl py-4 uppercase tracking-widest text-xs font-bold disabled:opacity-30 hover:bg-fuchsia transition-colors"
      >
        Continuar a Contacto →
      </button>
    </div>
  );

  // ─── STEP: CONTACT ────────────────────────────────────────────────────────────
  const renderContactStep = () => (
    <div className="space-y-6">
      <div className="bg-pearl border border-gold/20 p-4 space-y-1">
        <p className="text-[10px] uppercase tracking-widest text-onyx/50">Resumen del turno</p>
        <p className="font-serif text-onyx text-lg">
          {formData.date && new Date(formData.date + 'T12:00:00').toLocaleDateString('es-ES', {
            weekday: 'long', day: 'numeric', month: 'long'
          })} · {formData.time} hs (Arg)
        </p>
        {clientTimezone !== BUSINESS_TZ && (
          <p className="text-[10px] text-gold">
            Tu hora local: {utcToLocal(argTimeToUTC(formData.date, formData.time), clientTimezone)} ({clientTimezone})
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-2 text-onyx/60">Nombre *</label>
          <input
            type="text"
            className="w-full border-b border-gray-300 py-2 bg-transparent outline-none focus:border-fuchsia"
            value={formData.contact.firstName}
            onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, firstName: e.target.value } }))}
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase tracking-widest mb-2 text-onyx/60">Apellido *</label>
          <input
            type="text"
            className="w-full border-b border-gray-300 py-2 bg-transparent outline-none focus:border-fuchsia"
            value={formData.contact.lastName}
            onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, lastName: e.target.value } }))}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-2 text-onyx/60">Email *</label>
        <input
          type="email"
          placeholder="nombre@empresa.com"
          className="w-full border-b border-gray-300 py-2 bg-transparent outline-none focus:border-fuchsia"
          value={formData.contact.email}
          onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, email: e.target.value } }))}
        />
      </div>

      <div>
        <label className="block text-[10px] uppercase tracking-widest mb-2 text-onyx/60">WhatsApp *</label>
        <input
          type="tel"
          placeholder="+54 9 11 xxxx-xxxx"
          className="w-full border-b border-gray-300 py-2 bg-transparent outline-none focus:border-fuchsia"
          value={formData.contact.whatsapp}
          onChange={e => setFormData(p => ({ ...p, contact: { ...p.contact, whatsapp: e.target.value } }))}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={
          loading ||
          !formData.contact.firstName ||
          !formData.contact.lastName ||
          !formData.contact.email ||
          !formData.contact.whatsapp
        }
        className="w-full bg-fuchsia text-white py-5 uppercase tracking-widest text-xs font-bold flex items-center justify-center space-x-2 hover:bg-onyx transition-colors disabled:opacity-40"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Confirmando...</span>
          </>
        ) : (
          <span>Confirmar Diagnóstico</span>
        )}
      </button>

      <p className="text-[10px] text-onyx/30 text-center leading-relaxed">
        Al confirmar aceptás que te contactemos por WhatsApp y email para gestionar tu sesión.
      </p>
    </div>
  );

  // ─── STEP: SUCCESS ────────────────────────────────────────────────────────────
  const renderSuccess = () => (
    <div className="text-center py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 12 }}
        className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg shadow-green-200"
      >
        <CheckCircle2 size={48} className="text-white" />
      </motion.div>

      <h2 className="text-3xl md:text-4xl font-serif text-onyx mb-4">
        ¡Todo listo, {formData.contact.firstName}!
      </h2>

      <div className="bg-pearl border border-gold/20 p-6 max-w-sm mx-auto mb-8 text-left">
        <p className="text-[10px] uppercase tracking-widest text-onyx/40 mb-3">Detalle del turno</p>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-onyx/60">Fecha</span>
            <span className="font-semibold text-onyx">
              {new Date(formData.date + 'T12:00:00').toLocaleDateString('es-ES', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-onyx/60">Hora Argentina</span>
            <span className="font-semibold text-onyx">{formData.time} hs</span>
          </div>
          {clientTimezone !== BUSINESS_TZ && (
            <div className="flex justify-between">
              <span className="text-onyx/60">Tu hora local</span>
              <span className="font-semibold text-gold">
                {utcToLocal(argTimeToUTC(formData.date, formData.time), clientTimezone)}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-onyx/60">WhatsApp</span>
            <span className="font-semibold text-onyx">{formData.contact.whatsapp}</span>
          </div>
        </div>
      </div>

      <p className="text-onyx/50 text-sm max-w-xs mx-auto leading-relaxed mb-8">
        Te enviaremos el link de Zoom/Meet por WhatsApp 24hs antes de la sesión.
      </p>

      <button
        onClick={onClose}
        className="bg-onyx text-pearl px-10 py-4 uppercase tracking-widest text-xs hover:bg-fuchsia transition-colors"
      >
        Cerrar
      </button>
    </div>
  );

  // ─── RENDER ───────────────────────────────────────────────────────────────────
  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-onyx/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50 }}
        className="bg-pearl w-full max-w-4xl shadow-2xl overflow-hidden relative max-h-[95vh] flex flex-col"
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-onyx/30 hover:text-onyx z-30 transition-colors"
        >
          <X size={22} />
        </button>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
          {/* SIDEBAR */}
          <div className="md:w-[280px] bg-onyx p-8 md:p-10 text-pearl flex flex-col justify-between flex-shrink-0">
            <div>
              <p className="text-fuchsia text-[9px] uppercase tracking-[0.5em] mb-4">Experiencia Premium</p>
              <h2 className="text-2xl md:text-3xl font-serif mb-8 italic leading-tight">
                Sesión de<br />Diagnóstico
              </h2>

              {/* Progress Steps */}
              <div className="space-y-4 mb-10">
                {steps.map((s, i) => {
                  const isActive = s.key === step;
                  const isDone = i < currentStepIndex;
                  return (
                    <div key={s.key} className={`flex items-center space-x-3 transition-all ${
                      isActive ? 'opacity-100' : isDone ? 'opacity-60' : 'opacity-25'
                    }`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold ${
                        isDone ? 'bg-green-500 text-white' : isActive ? 'bg-fuchsia text-white' : 'border border-pearl/30 text-pearl/40'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-[10px] uppercase tracking-widest ${isActive ? 'text-pearl font-bold' : 'text-pearl/60'}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <ul className="space-y-4 text-sm text-pearl/50 border-t border-pearl/10 pt-8">
                {[
                  '60 minutos de profundidad estratégica.',
                  'Análisis de coherencia personal.',
                  'Hoja de ruta 1 a 1.'
                ].map((item, i) => (
                  <li key={i} className="flex items-start space-x-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-1 p-8 md:p-12 flex flex-col overflow-y-auto">
            {step !== 'success' && (
              <div className="flex items-center space-x-4 mb-8">
                {step !== 'date' && (
                  <button onClick={handleBack} className="text-onyx/30 hover:text-onyx transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div>
                  <h3 className="text-xs uppercase tracking-[0.3em] font-bold text-onyx">
                    {steps.find(s => s.key === step)?.label}
                  </h3>
                  {step === 'date' && (
                    <p className="text-[10px] text-onyx/40 mt-0.5">Seleccioná un día disponible</p>
                  )}
                  {step === 'time' && formData.date && (
                    <p className="text-[10px] text-onyx/40 mt-0.5">
                      {new Date(formData.date + 'T12:00:00').toLocaleDateString('es-ES', {
                        weekday: 'long', day: 'numeric', month: 'long'
                      })}
                    </p>
                  )}
                </div>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1"
              >
                {step === 'date' && renderDateStep()}
                {step === 'time' && renderTimeStep()}
                {step === 'survey' && renderSurveyStep()}
                {step === 'contact' && renderContactStep()}
                {step === 'success' && renderSuccess()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};