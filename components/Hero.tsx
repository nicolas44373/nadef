import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star } from 'lucide-react';

interface HeroProps {
  onStartBooking: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartBooking }) => {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-pearl py-20 md:py-0">
      {/* Dynamic Background Elements - Oculto en móvil para mejor performance */}
      <div className="absolute top-0 right-0 w-full md:w-[40%] h-full bg-onyx opacity-10 md:opacity-100">
         <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=1287&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay"></div>
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row items-center gap-8 md:gap-0">
        
        {/* Contenido de texto */}
        <div className="w-full md:w-3/5 text-left order-2 md:order-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 mb-4 md:mb-6"
          >
            <div className="h-[1px] w-8 md:w-12 bg-gold"></div>
            <span className="text-fuchsia text-[9px] md:text-[10px] font-bold tracking-[0.4em] md:tracking-[0.5em] uppercase">
              Estrategia de Imagen Elite
            </span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-[100px] font-serif text-onyx mb-6 md:mb-8 leading-[0.95] tracking-tighter"
          >
            EL ARTE DE <br />
            <span className="italic text-gold-gradient">LIDERAR</span> <br />
            TU PRESENCIA
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base md:text-xl text-onyx/70 mb-8 md:mb-12 max-w-xl leading-relaxed font-light"
          >
            Donde la psicología profunda se encuentra con el estilo de alto nivel. Transformamos tu imagen en una herramienta de autoridad innegable.
          </motion.p>
          
          <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.6 }}
             className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 md:space-x-8"
          >
            <button 
              onClick={onStartBooking}
              className="group relative overflow-hidden bg-fuchsia text-white px-8 md:px-10 py-5 md:py-6 tracking-[0.2em] uppercase text-[10px] md:text-xs font-bold shadow-2xl transition-all w-full sm:w-auto"
            >
              <span className="relative z-10 flex items-center justify-center">
                Agenda tu sesión <ArrowRight size={16} className="ml-2 md:ml-3 group-hover:translate-x-2 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-onyx translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
            </button>
            
            <div className="flex items-center space-x-3 text-onyx/40">
               <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-7 h-7 md:w-8 md:h-8 rounded-full border-2 border-pearl overflow-hidden bg-gray-200 flex-shrink-0">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="client" className="w-full h-full object-cover" />
                    </div>
                  ))}
               </div>
               <span className="text-[9px] md:text-[10px] uppercase tracking-widest font-bold">+250 LÍDERES</span>
            </div>
          </motion.div>
        </div>

        {/* Imagen principal - Orden primero en mobile */}
        <div className="w-full md:w-2/5 relative flex items-center justify-center order-1 md:order-2">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="relative z-10 w-full max-w-[320px] md:max-w-md mx-auto"
          >
            {/* Main Portrait - Sin cortes en mobile */}
            <div className="relative aspect-[3/4] overflow-hidden mask-editorial border-[8px] md:border-[12px] border-white shadow-2xl">
              <img 
                src="./1propu.jpeg" 
                alt="María Emilia Nadef" 
                className="w-full h-full object-cover object-center transition-transform duration-[3s] hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-fuchsia/20 to-transparent mix-blend-multiply"></div>
            </div>
            
            {/* Floating Gold Detail - Ajustado para mobile */}
            <motion.div 
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-6 -right-6 md:-top-10 md:-right-10 w-24 h-24 md:w-32 md:h-32 glass-premium p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-xl"
            >
               <Star className="text-gold mb-1" size={16} fill="#D4AF37" />
               <p className="text-[7px] md:text-[8px] uppercase tracking-widest font-bold text-onyx">Estratega Senior</p>
            </motion.div>
          </motion.div>
          
          {/* Background Text Decor - Más pequeño en mobile */}
          <div className="absolute bottom-0 right-0 opacity-5 pointer-events-none hidden md:block">
             <h2 className="text-[80px] md:text-[150px] font-serif leading-none">NADEF</h2>
          </div>
        </div>
      </div>
    </section>
  );
};