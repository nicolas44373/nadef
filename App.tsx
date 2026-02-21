import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { Header, Footer } from './components/Layout';
import { Hero } from './components/Hero';
import { BookingSystem } from './components/BookingSystem';
import { Dashboard } from './components/Admin/Dashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { Quote, CheckCircle, Play, Pause, ArrowRight } from 'lucide-react';

// ─── APP CONTENT ──────────────────────────────────────────────────────────────
const AppContent: React.FC = () => {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Cierra booking al cambiar de ruta
  useEffect(() => {
    setIsBookingOpen(false);
  }, [location.pathname]);

  const handleNavigate = (page: 'home' | 'agenda' | 'admin' | 'services') => {
    if (page === 'agenda') {
      setIsBookingOpen(true);
      if (location.pathname !== '/') navigate('/');
    } else if (page === 'home') {
      navigate('/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (page === 'admin') {
      navigate('/admin');
    } else if (page === 'services') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      } else {
        document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const currentPage = location.pathname === '/' ? 'home' : location.pathname.substring(1);

  return (
    <div className="flex flex-col min-h-screen selection:bg-fuchsia selection:text-white">
      <Header onNavigate={handleNavigate} currentPage={currentPage} />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage onOpenBooking={() => setIsBookingOpen(true)} />} />
          <Route
            path="/admin"
            element={
              <AdminPage
                isAdminAuth={isAdminAuth}
                setIsAdminAuth={setIsAdminAuth}
                onLogout={() => { setIsAdminAuth(false); navigate('/'); }}
              />
            }
          />
          {/* Ruta 404 */}
          <Route path="*" element={<NotFound onGoHome={() => navigate('/')} />} />
        </Routes>
      </main>

      <Footer onNavigate={handleNavigate} />

      <AnimatePresence>
        {isBookingOpen && (
          <BookingSystem onClose={() => setIsBookingOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── VIDEO HERO ───────────────────────────────────────────────────────────────
const VideoHeroSection: React.FC<{ onOpenBooking: () => void }> = ({ onOpenBooking }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <section className="relative min-h-screen bg-pearl overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-screen py-20 lg:py-0">
          {/* Video */}
          <motion.div
            initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1 }}
            className="relative order-2 lg:order-1"
          >
            <div className="relative aspect-[832/464] overflow-hidden shadow-2xl">
              <video
                ref={videoRef} className="absolute inset-0 w-full h-full object-cover"
                loop playsInline muted={isMuted}
                onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
              >
                <source src="/videoo.mp4" type="video/mp4" />
              </video>
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between z-20">
                <button
                  onClick={togglePlay}
                  className="bg-fuchsia hover:bg-gold text-white p-3 rounded-full shadow-lg transition-all"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <button
                  onClick={toggleMute}
                  className="bg-onyx/80 hover:bg-onyx text-white px-4 py-2 rounded-full text-xs uppercase tracking-wider"
                >
                  {isMuted ? 'Silenciado' : 'Con audio'}
                </button>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-gold text-onyx p-6 shadow-2xl z-10 hidden md:block">
              <p className="text-xs uppercase tracking-[0.3em] font-bold">+250 Líderes</p>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 1, delay: 0.3 }}
            className="order-1 lg:order-2 flex flex-col justify-center"
          >
            <div className="flex items-center space-x-2 mb-6">
              <div className="h-[1px] w-12 bg-gold" />
              <span className="text-gold text-[10px] md:text-xs uppercase tracking-[0.5em] font-bold">
                Estrategia de Imagen Elite
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-onyx mb-8 leading-tight">
              Transforma Tu <br />
              <span className="italic text-gold-gradient">Presencia Ejecutiva</span>
            </h2>
            <p className="text-lg md:text-xl text-onyx/70 mb-10 leading-relaxed font-light max-w-xl">
              Descubre cómo líderes globales construyen autoridad innegable a través de una imagen estratégica
            </p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <button
                onClick={onOpenBooking}
                className="group relative overflow-hidden bg-fuchsia text-white px-8 md:px-10 py-5 tracking-[0.2em] uppercase text-xs font-bold shadow-2xl transition-all"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Agenda tu sesión <ArrowRight size={16} className="ml-3 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-onyx translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              <button
                onClick={togglePlay}
                className="text-onyx text-xs uppercase tracking-[0.3em] font-bold flex items-center space-x-2 hover:text-fuchsia transition-colors"
              >
                {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                <span>{isPlaying ? 'Pausar video' : 'Ver video'}</span>
              </button>
            </div>
            <div className="flex items-center space-x-3 text-onyx/40 mt-10">
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-pearl overflow-hidden bg-gray-200 flex-shrink-0">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="client" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold">+250 LÍDERES TRANSFORMADOS</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

// ─── HOME PAGE ────────────────────────────────────────────────────────────────
const HomePage: React.FC<{ onOpenBooking: () => void }> = ({ onOpenBooking }) => (
  <>
    <Hero onStartBooking={onOpenBooking} />

    {/* The Philosophy */}
    <section className="py-16 md:py-24 lg:py-40 bg-white relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              className="relative z-10"
            >
              <div className="relative aspect-[4/5] overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=1471&auto=format&fit=crop"
                  alt="Success Confidence"
                  className="w-full h-full object-cover object-center shadow-2xl mask-editorial"
                />
              </div>
              <div className="absolute -bottom-4 md:-bottom-6 lg:-bottom-10 -right-4 md:-right-6 lg:-right-10 bg-onyx text-pearl p-4 md:p-6 lg:p-10 max-w-[200px] md:max-w-[240px] lg:max-w-[280px] shadow-2xl">
                <Quote className="text-gold mb-2 md:mb-3 lg:mb-4" size={20} />
                <p className="font-serif italic text-base md:text-lg lg:text-xl leading-relaxed">
                  "Tu imagen es el prólogo de tu historia de éxito."
                </p>
              </div>
            </motion.div>
          </div>
          <div className="lg:col-span-7 pl-0 lg:pl-10 mt-16 md:mt-20 lg:mt-0">
            <span className="text-gold font-bold text-[10px] uppercase tracking-[0.5em] md:tracking-[0.6em] mb-4 md:mb-6 block">
              Metodología Nadef
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-serif text-onyx mb-6 md:mb-8 lg:mb-10 leading-tight">
              Donde la mente <br />
              <span className="italic text-fuchsia">habita la piel</span>
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-onyx/60 mb-8 md:mb-10 lg:mb-12 leading-relaxed font-light">
              No se trata de la ropa, se trata de la <span className="text-onyx font-medium">congruencia</span>. Trabajo con líderes que entienden que su presencia es su activo más valioso.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 lg:gap-10">
              {[
                { title: 'Para Ellas', sub: 'Sofisticación, poder femenino y elegancia estratégica.' },
                { title: 'Para Ellos', sub: 'Autoridad moderna, precisión sastrera y carisma visual.' },
              ].map(item => (
                <div key={item.title} className="flex items-start space-x-3 md:space-x-4">
                  <div className="mt-1 text-gold flex-shrink-0"><CheckCircle size={18} /></div>
                  <div>
                    <h4 className="font-serif text-lg md:text-xl lg:text-2xl mb-2">{item.title}</h4>
                    <p className="text-xs md:text-sm text-onyx/50">{item.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    <VideoHeroSection onOpenBooking={onOpenBooking} />

    {/* Lookbook */}
    <section className="py-16 md:py-24 lg:py-32 bg-onyx text-pearl overflow-hidden">
      <div className="container mx-auto px-4 md:px-6 mb-10 md:mb-16 lg:mb-20 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 md:gap-6">
        <div className="max-w-xl">
          <h2 className="text-3xl md:text-5xl lg:text-6xl xl:text-7xl font-serif mb-3 md:mb-4 lg:mb-6 italic">
            Inspiración de Autoridad
          </h2>
          <p className="text-pearl/40 tracking-widest uppercase text-[10px] md:text-xs">
            Explora el estándar de la excelencia visual
          </p>
        </div>
        <button
          onClick={onOpenBooking}
          className="border-b border-gold text-gold py-2 text-[10px] md:text-xs uppercase tracking-[0.3em] md:tracking-[0.4em] font-bold hover:text-fuchsia hover:border-fuchsia transition-colors"
        >
          Agenda tu diagnóstico →
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 lg:gap-8 px-4 md:px-6">
        {[
          { img: '../1.jpeg', title: 'Minimalismo Estructural', category: 'Hombre' },
          { img: '../2.jpeg', title: 'Poder Cromático', category: 'Mujer' },
          { img: '../3.jpeg', title: 'Autoridad Corporativa', category: 'Hombre' },
        ].map(({ img, title, category }) => (
          <React.Fragment key={title}>
            <LookbookItem img={img} title={title} category={category} />
          </React.Fragment>
        ))}
      </div>
    </section>

    {/* Services */}
    <section className="py-16 md:py-24 lg:py-40 bg-pearl" id="services">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16 lg:mb-24">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif text-onyx mb-4">Servicios Signature</h2>
          <div className="h-1 w-20 md:w-24 bg-gold mx-auto" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          <ServiceCard
            title="The Executive Path"
            subtitle="Para líderes de alta dirección"
            description="Estrategia 360 de imagen pública. Desde el boardroom hasta apariciones mediáticas."
            img="./2da pro.jpeg"
            imagePosition="top"
            features={['Análisis de Psicología de Poder', 'Protocolo Internacional', 'Gestión de Marca Personal']}
            onAction={onOpenBooking}
          />
          <ServiceCard
            title="The Identity Shift"
            subtitle="Transformación de Identidad Visual"
            description="Reconciliación profunda entre tu autoconcepto y la imagen que proyectas al mundo."
            img="./3pr.jpeg"
            imagePosition="center"
            features={['Auditoría de Esencia', 'Arquitectura de Estilo', 'Acompañamiento 1:1']}
            onAction={onOpenBooking}
          />
        </div>
      </div>
    </section>
  </>
);

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
const AdminPage: React.FC<{
  isAdminAuth: boolean;
  setIsAdminAuth: (v: boolean) => void;
  onLogout: () => void;
}> = ({ isAdminAuth, setIsAdminAuth, onLogout }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  // En producción usá Supabase Auth. Esta es una verificación básica por ahora.
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'nadef2026';

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsAdminAuth(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!isAdminAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-onyx px-4 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-pearl p-8 md:p-12 max-w-md w-full shadow-2xl"
        >
          <div className="text-center mb-10">
            <p className="text-fuchsia text-[9px] uppercase tracking-[0.5em] mb-2">Acceso Restringido</p>
            <h2 className="text-2xl md:text-3xl font-serif text-onyx">Panel Admin</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-onyx/60 mb-2">Contraseña</label>
              <input
                type="password"
                className={`w-full border-b py-3 text-center tracking-widest outline-none bg-transparent transition-colors ${
                  error ? 'border-red-400 text-red-500' : 'border-gold focus:border-fuchsia'
                }`}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(false); }}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                autoFocus
                placeholder="••••••••"
              />
              {error && <p className="text-xs text-red-500 mt-2 text-center">Contraseña incorrecta</p>}
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-onyx text-pearl py-4 uppercase tracking-[0.2em] text-xs font-bold hover:bg-fuchsia transition-colors"
            >
              Ingresar al Panel
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-0">
      <Dashboard onLogout={onLogout} />
    </div>
  );
};

// ─── NOT FOUND ────────────────────────────────────────────────────────────────
const NotFound: React.FC<{ onGoHome: () => void }> = ({ onGoHome }) => (
  <div className="min-h-screen flex items-center justify-center bg-pearl">
    <div className="text-center">
      <h1 className="text-8xl font-serif text-onyx/10 mb-4">404</h1>
      <p className="text-onyx/40 mb-8 uppercase tracking-widest text-xs">Página no encontrada</p>
      <button onClick={onGoHome} className="bg-fuchsia text-white px-8 py-4 text-xs uppercase tracking-widest hover:bg-onyx transition-colors">
        Volver al inicio
      </button>
    </div>
  </div>
);

// ─── AUXILIARY COMPONENTS ─────────────────────────────────────────────────────
const LookbookItem = ({ img, title, category }: { img: string; title: string; category: string }) => (
  <motion.div whileHover={{ y: -10 }} className="relative group aspect-[3/4] overflow-hidden">
    <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
    <div className="absolute inset-0 bg-gradient-to-t from-onyx/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 md:p-6 lg:p-8">
      <span className="text-gold text-[9px] md:text-[10px] uppercase tracking-widest mb-1 md:mb-2 font-bold">{category}</span>
      <h4 className="font-serif text-lg md:text-xl lg:text-2xl text-pearl">{title}</h4>
    </div>
  </motion.div>
);

interface ServiceCardProps {
  title: string; subtitle: string; description: string;
  img: string; features: string[]; onAction: () => void;
  imagePosition?: 'top' | 'center' | 'bottom';
}

const ServiceCard: React.FC<ServiceCardProps> = ({ title, subtitle, description, img, features, onAction, imagePosition = 'center' }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    className="bg-white group overflow-hidden shadow-sm hover:shadow-2xl transition-all border border-gray-100"
  >
    <div className="relative aspect-[4/3] overflow-hidden">
      <img
        src={img} alt={title}
        className={`w-full h-full object-cover object-${imagePosition} transition-transform duration-1000 group-hover:scale-110`}
      />
      <div className="absolute inset-0 bg-onyx/20 group-hover:bg-fuchsia/10 transition-colors" />
      <div className="absolute top-3 md:top-4 lg:top-6 left-3 md:left-4 lg:left-6 bg-white/90 backdrop-blur-md px-3 md:px-4 py-1.5 text-[9px] uppercase tracking-widest font-bold text-onyx">
        Premium Program
      </div>
    </div>
    <div className="p-6 md:p-8 lg:p-12">
      <h3 className="text-2xl md:text-3xl lg:text-4xl font-serif text-onyx mb-2">{title}</h3>
      <p className="text-fuchsia font-bold text-[10px] md:text-xs uppercase tracking-widest mb-4 md:mb-6">{subtitle}</p>
      <p className="text-onyx/60 text-sm md:text-base lg:text-lg leading-relaxed mb-6 md:mb-8 lg:mb-10">{description}</p>
      <div className="space-y-3 md:space-y-4 mb-6 md:mb-8 lg:mb-12">
        {features.map((f, i) => (
          <div key={i} className="flex items-center space-x-3 text-xs uppercase tracking-[0.2em] font-medium text-onyx/80">
            <div className="w-2 h-2 bg-gold flex-shrink-0" />
            <span>{f}</span>
          </div>
        ))}
      </div>
      <button
        onClick={onAction}
        className="w-full py-4 md:py-5 lg:py-6 border-2 border-onyx text-onyx uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs font-bold transition-all hover:bg-onyx hover:text-pearl"
      >
        Inicia tu diagnóstico
      </button>
    </div>
  </motion.div>
);

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const App: React.FC = () => (
  <BrowserRouter>
    <AppContent />
  </BrowserRouter>
);

export default App;