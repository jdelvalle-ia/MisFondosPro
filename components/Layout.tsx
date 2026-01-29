import React, { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Wallet, PieChart, Settings as SettingsIcon, Activity, Terminal, Sun, Moon } from 'lucide-react';
import { AppView } from '../types.ts';

interface Props {
  children: React.ReactNode;
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  portfolioName: string;
  onOpenTerminal: () => void;
}

export const Layout: React.FC<Props> = ({ children, activeView, onNavigate, portfolioName, onOpenTerminal }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Reset de scroll al cambiar de vista
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeView]);

  // Aplicar modo claro/oscuro al body
  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.remove('light-mode');
    } else {
      document.body.classList.add('light-mode');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  // Normalización del nombre para el display
  const displayName = portfolioName && portfolioName.trim() !== '' 
    ? portfolioName.toUpperCase() 
    : 'CARTERA SIN TÍTULO';

  const isPlaceholder = displayName === 'CARTERA SIN TÍTULO';

  return (
    <div className="flex h-screen bg-background text-white overflow-hidden transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-card flex flex-col z-30 shadow-2xl transition-colors duration-300">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-neon/20 p-1.5 rounded-lg">
            <Activity className="text-neon" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tighter text-white">MISFONDOS <span className="text-neon uppercase">PRO</span></h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeView === AppView.DASHBOARD} 
            onClick={() => onNavigate(AppView.DASHBOARD)} 
          />
          <NavItem 
            icon={<Wallet size={20} />} 
            label="Cartera" 
            active={activeView === AppView.PORTFOLIO} 
            onClick={() => onNavigate(AppView.PORTFOLIO)} 
          />
          <NavItem 
            icon={<PieChart size={20} />} 
            label="Análisis" 
            active={activeView === AppView.ANALYSIS} 
            onClick={() => onNavigate(AppView.ANALYSIS)} 
          />
          <div className="pt-4 mt-4 border-t border-gray-800">
            <NavItem 
              icon={<SettingsIcon size={20} />} 
              label="Configuración" 
              active={activeView === AppView.SETTINGS} 
              onClick={() => onNavigate(AppView.SETTINGS)} 
            />
          </div>
        </nav>
        
        <div className="p-4 m-4 bg-surface/30 rounded-xl border border-gray-800 flex flex-col gap-3">
          <button 
            onClick={onOpenTerminal}
            className="w-full flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-neon transition-colors uppercase font-bold tracking-widest"
          >
            <Terminal size={14} /> Consola de Sistema
          </button>

          <button 
            onClick={toggleTheme}
            className="w-full flex items-center justify-center gap-2 text-[10px] text-gray-500 hover:text-neon transition-colors uppercase font-bold tracking-widest"
          >
            {isDarkMode ? (
              <><Sun size={14} /> Modo Claro</>
            ) : (
              <><Moon size={14} /> Modo Oscuro</>
            )}
          </button>
          
          <div className="flex flex-col items-center pt-2 border-t border-gray-800/50">
            <span className="text-[9px] font-mono text-gray-600 uppercase tracking-widest">Build Version</span>
            <span className="text-[10px] font-black text-gray-500 font-mono">v1.2.8-stable</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-neon/5 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet/5 blur-[120px] rounded-full -ml-48 -mb-48 pointer-events-none"></div>

        <header className="h-16 border-b border-gray-800 px-8 flex items-center justify-between bg-card/50 backdrop-blur-md z-[20] transition-colors duration-300">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">Vista</span>
            <div className="h-4 w-[1px] bg-gray-700 mx-2"></div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">{activeView}</h2>
          </div>
          <div className="flex items-center gap-4 max-w-[60%]">
             <div className="px-5 py-2 rounded-full bg-surface border border-gray-700 text-[10px] font-bold text-neon shadow-neon/10 shadow-lg flex items-center overflow-hidden">
                <span className="opacity-40 mr-2 text-white italic shrink-0">PORTAFOLIO</span>
                <span className={`truncate tracking-tight ${isPlaceholder ? 'italic opacity-60 text-gray-400' : 'uppercase'}`}>
                  {displayName}
                </span>
              </div>
          </div>
        </header>
        
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto custom-scrollbar relative z-10 scroll-smooth"
        >
          <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

const NavItem = ({ icon, label, active, onClick }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 group ${
      active 
        ? 'bg-neon/10 text-neon border border-neon/20 shadow-lg shadow-neon/5' 
        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    <span className={`${active ? 'scale-110' : 'group-hover:scale-110'} transition-transform duration-300`}>
      {icon}
    </span>
    <span className="text-sm font-semibold tracking-tight">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-neon shadow-neon"></div>}
  </button>
);