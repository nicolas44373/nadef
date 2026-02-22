import React, { useState, useEffect } from 'react';
import { Menu, X, Instagram, Youtube } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface LayoutProps {
  children?: React.ReactNode;
  onNavigate: (page: 'home' | 'agenda' | 'admin' | 'services') => void;
  currentPage: string;
}

export const Header: React.FC<LayoutProps> = ({ onNavigate, currentPage }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cierra el menú mobile al scrollear
  useEffect(() => {
    if (mobileMenuOpen) setMobileMenuOpen(false);
  }, [currentPage]);

  const navLinks: { id: 'home' | 'services' | 'agenda'; label: string }[] = [
    { id: 'home', label: 'Inicio' },
    { id: 'services', label: 'Estrategia' },
    { id: 'agenda', label: 'Sesión Directa' },
  ];

  return (
    <header className={`fixed top-0 w-full z-[100] transition-all duration-700 ${
      isScrolled
        ? 'bg-pearl/98 backdrop-blur-2xl py-3 md:py-4 shadow-lg'
        : 'bg-pearl/95 backdrop-blur-xl py-4 md:py-6 shadow-md'
    }`}>
      <div className="container mx-auto px-4 md:px-6 flex justify-between items-center border-b border-onyx/5 pb-2">
        <button onClick={() => onNavigate('home')} className="group flex flex-col items-start">
          <span className="text-base sm:text-lg md:text-2xl font-serif tracking-[0.15em] sm:tracking-[0.2em] md:tracking-[0.3em] text-onyx leading-none group-hover:text-fuchsia transition-colors">
            MARÍA EMILIA NADEF
          </span>
          <span className="text-[7px] md:text-[9px] uppercase tracking-[0.3em] md:tracking-[0.6em] text-onyx/40 mt-1">
            Estrategia de Imagen Elite
          </span>
        </button>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center space-x-8 xl:space-x-12">
          {navLinks.map(link => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`group relative text-[10px] uppercase tracking-[0.4em] font-bold transition-all ${
                currentPage === link.id ? 'text-fuchsia' : 'text-onyx hover:text-fuchsia'
              }`}
            >
              {link.label}
              <span className={`absolute -bottom-1 left-0 h-[1px] bg-fuchsia transition-all duration-300 ${
                currentPage === link.id ? 'w-full' : 'w-0 group-hover:w-full'
              }`} />
            </button>
          ))}
        </nav>

        {/* Mobile Toggle */}
        <button
          className="lg:hidden text-onyx p-2 hover:text-fuchsia transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 w-full bg-pearl/98 backdrop-blur-2xl border-b border-gold/20 overflow-hidden shadow-lg"
          >
            <div className="flex flex-col items-center py-8 space-y-6">
              {navLinks.map(link => (
                <button
                  key={link.id}
                  onClick={() => { onNavigate(link.id); setMobileMenuOpen(false); }}
                  className={`text-xs uppercase tracking-[0.4em] font-bold transition-colors ${
                    currentPage === link.id ? 'text-fuchsia' : 'text-onyx hover:text-fuchsia'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

// ─── FOOTER ───────────────────────────────────────────────────────────────────
interface FooterProps {
  onNavigate: (page: 'home' | 'agenda' | 'admin' | 'services') => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => (
  <footer className="bg-onyx text-pearl py-16 md:py-24 lg:py-32 border-t border-gold/10">
    <div className="container mx-auto px-4 md:px-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 lg:gap-16 mb-12 md:mb-16 lg:mb-24">
        <div className="sm:col-span-2">
          <button onClick={() => onNavigate('home')}>
            <h3 className="font-serif text-xl md:text-2xl lg:text-3xl tracking-widest mb-4 md:mb-6 lg:mb-8 italic hover:text-fuchsia transition-colors">
              MARÍA EMILIA NADEF
            </h3>
          </button>
          <p className="text-pearl/50 text-sm md:text-base lg:text-lg leading-relaxed max-w-md font-light">
            Especialista en psicología de imagen y estratega de presencia ejecutiva. Ayudamos a líderes a encontrar su voz visual y proyectar autoridad innegable.
          </p>
        </div>

        <div>
          <span className="text-gold text-[10px] uppercase tracking-[0.5em] mb-4 md:mb-6 lg:mb-8 block font-bold">
            Navegación
          </span>
          <div className="flex flex-col space-y-2 md:space-y-3 lg:space-y-4 text-xs uppercase tracking-widest font-medium">
            <button
              onClick={() => onNavigate('home')}
              className="text-left hover:text-fuchsia transition-colors"
            >
              Inicio
            </button>
            <button
              onClick={() => onNavigate('services')}
              className="text-left hover:text-fuchsia transition-colors"
            >
              Servicios Elite
            </button>
            <button
              onClick={() => onNavigate('agenda')}
              className="text-left hover:text-fuchsia transition-colors"
            >
              Agenda Directa
            </button>
            {/* Link oculto al admin - solo visible si sabés que existe */}
            
          </div>
        </div>

        <div>
          <span className="text-gold text-[10px] uppercase tracking-[0.5em] mb-4 md:mb-6 lg:mb-8 block font-bold">
            Social
          </span>
          <div className="flex flex-col space-y-2 md:space-y-3 lg:space-y-4 text-xs uppercase tracking-widest font-medium">
            <a
              href="https://www.instagram.com/eminadef?igsh=MTl2djRjZGRsbjN4aw%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-fuchsia transition-colors"
            >
              <Instagram size={16} /> <span>Instagram</span>
            </a>
            <a
              href="https://youtube.com/@eminadef7121?si=DnByRAu0At7Gq5tG" target="_blank" rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-fuchsia transition-colors"
            >
              <Youtube size={16} /> <span>YouTube</span>
            </a>
            <a
              href="https://www.tiktok.com/@eminadef?_r=1&_t=ZS-947N1QGSfW3" target="_blank" rel="noopener noreferrer"
              className="flex items-center space-x-2 hover:text-fuchsia transition-colors"
            >
              <span className="font-bold text-sm">Tk</span> <span>TikTok</span>
            </a>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center text-[8px] md:text-[9px] tracking-[0.3em] md:tracking-[0.5em] uppercase text-pearl/20 border-t border-pearl/5 pt-6 md:pt-8 lg:pt-12 space-y-3 md:space-y-0 text-center md:text-left">
        <p>&copy; {new Date().getFullYear()} MARÍA EMILIA NADEF. ESTRATEGIA DE IMAGEN DE ALTO NIVEL.</p>
        <p>REFINADO POR LUXE DIGITAL</p>
      </div>
    </div>
  </footer>
);