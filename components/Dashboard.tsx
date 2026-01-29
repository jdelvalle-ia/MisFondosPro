import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Fund } from '../types.ts';
import { INITIAL_FUNDS } from '../services/mockData.ts';
import { 
  DollarSign, TrendingUp, Target, Activity, ShieldAlert, 
  PieChart as PieIcon, TrendingDown, Info, BarChart3, List,
  Sparkles, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, PieChart, Pie, Cell
} from 'recharts';

const COLORS = ['#8A2BE2', '#3B82F6', '#00FFCC', '#F59E0B', '#EF4444', '#EC4899'];

const toSentenceCase = (text: string) => {
  if (!text) return '';
  return text.trim().charAt(0).toUpperCase() + text.trim().slice(1).toLowerCase();
};

const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, showBelow: false });

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({
        top: rect.top,
        left: rect.left + rect.width / 2,
        showBelow: rect.top < 180
      });
    }
  }, [show]);

  return (
    <div className="relative inline-block ml-2 select-none" ref={triggerRef}>
      <div 
        className="cursor-help text-gray-500 hover:text-neon transition-colors p-1"
        onMouseEnter={() => setShow(true)} 
        onMouseLeave={() => setShow(false)}
      >
        <Info size={14} />
      </div>
      {show && (
        <div 
          className="fixed z-[9999] w-64 p-4 bg-[#1a1f26] border border-gray-700 rounded-2xl shadow-2xl text-[12px] text-gray-200 leading-relaxed animate-fade-in pointer-events-none font-medium text-left"
          style={{
            top: pos.showBelow ? `${pos.top + 28}px` : `${pos.top - 12}px`,
            left: `${pos.left}px`,
            transform: pos.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
        >
          {toSentenceCase(text)}
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC<{ funds: Fund[] }> = ({ funds }) => {
  const isDemo = funds.length === 0;
  const effectiveFunds = isDemo ? INITIAL_FUNDS : funds;

  const stats = useMemo(() => {
    const totalInvested = effectiveFunds.reduce((acc, f) => acc + (f.investedAmount || 0), 0);
    const totalCurrent = effectiveFunds.reduce((acc, f) => acc + ((f.shares || 0) * (f.currentNAV || 0)), 0);
    const profit = totalCurrent - totalInvested;
    const profitPerc = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
    
    const byCategory: Record<string, number> = {};
    effectiveFunds.forEach(f => {
      const val = (f.shares || 0) * (f.currentNAV || 0);
      byCategory[f.category || 'Otros'] = (byCategory[f.category || 'Otros'] || 0) + val;
    });
    
    const sectorData = Object.entries(byCategory)
      .map(([name, value]) => ({ 
        name, value, percent: (value / (totalCurrent || 1)) * 100
      })).sort((a, b) => b.value - a.value);

    const sortedFunds = [...effectiveFunds].map(f => ({
      ...f,
      currentVal: f.shares * f.currentNAV,
      pPerc: ((f.shares * f.currentNAV) - f.investedAmount) / f.investedAmount * 100
    })).sort((a, b) => b.pPerc - a.pPerc);

    return { 
      totalInvested, totalCurrent, profit, profitPerc, 
      sectorData,
      topFunds: sortedFunds.slice(0, 5),
      bottomFunds: [...sortedFunds].reverse().slice(0, 5)
    };
  }, [effectiveFunds]);

  const historyData = useMemo(() => {
    const buyDates = effectiveFunds.map(f => new Date(f.buyDate).getTime());
    const minTimestamp = Math.min(...buyDates);
    const maxTimestamp = new Date().getTime();
    
    const points = 12;
    const timeline = [];
    
    for (let i = 0; i < points; i++) {
      const currentT = minTimestamp + (maxTimestamp - minTimestamp) * (i / (points - 1));
      const date = new Date(currentT);
      
      let totalValueAtPoint = 0;
      effectiveFunds.forEach(fund => {
        const fundBuyT = new Date(fund.buyDate).getTime();
        if (fundBuyT <= currentT) {
          const totalInv = fund.investedAmount;
          const totalCur = fund.shares * fund.currentNAV;
          const progress = (currentT - fundBuyT) / (maxTimestamp - fundBuyT || 1);
          const estimatedValue = totalInv + (totalCur - totalInv) * Math.pow(progress, 1.15);
          totalValueAtPoint += estimatedValue;
        }
      });

      timeline.push({
        name: date.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toLowerCase(),
        val: totalValueAtPoint
      });
    }
    return timeline;
  }, [effectiveFunds]);

  return (
    <div className="space-y-10 animate-fade-in pb-20 w-full overflow-hidden">
      {/* MODO DEMO BANNER */}
      {isDemo && (
        <div className="bg-gradient-to-r from-violet/20 to-neon/10 border border-violet/30 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl animate-pulse-slow">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-violet rounded-2xl shadow-violet">
                <Sparkles className="text-white" size={24} />
             </div>
             <div>
                <h4 className="text-white font-black text-lg uppercase tracking-tight leading-none">Modo de Visualización Activo</h4>
                <p className="text-gray-400 text-sm mt-1 font-medium">Estás viendo datos de ejemplo. Configura tu cartera real para un análisis personalizado.</p>
             </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black text-white/50 uppercase tracking-widest">Demo v1.2.8</div>
          </div>
        </div>
      )}

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 overflow-visible">
        <KPI card="Patrimonio Total" info="Valor total actual." desc="Capital Neto" value={stats.totalCurrent} icon={<DollarSign className="text-neon" />} isDemo={isDemo} />
        <KPI card="Inversión Inicial" info="Total desembolsado." desc="Coste Cartera" value={stats.totalInvested} icon={<Target className="text-blue-400" />} isDemo={isDemo} />
        <KPI card="Rendimiento Global" info="Balance total acumulado." desc="Rentabilidad" value={stats.profit} icon={<TrendingUp className="text-violet" />} trend={stats.profitPerc} color={stats.profit >= 0 ? 'text-neon' : 'text-red-500'} isDemo={isDemo} />
      </div>

      {/* CHART ROW */}
      <div className="bg-card border border-gray-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 lg:p-12 shadow-2xl overflow-hidden relative">
        {isDemo && <DemoWatermark />}
        <div className="flex justify-between items-center mb-8 md:mb-12">
          <h3 className="text-xl md:text-2xl font-black flex items-center tracking-tight text-white gap-4 uppercase">
            <Activity className="text-neon" size={28} /> Evolución Patrimonial
          </h3>
        </div>
        <div className="h-[300px] md:h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData}>
              <defs>
                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFCC" stopOpacity={0.25}/><stop offset="95%" stopColor="#00FFCC" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} opacity={0.1} />
              {/* Fix: removed invalid md:fontSize prop and set a standard fontSize */}
              <XAxis dataKey="name" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tick={{dy: 10}} />
              <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid #374151', borderRadius: '16px' }} />
              <Area type="monotone" dataKey="val" stroke="#00FFCC" strokeWidth={5} fill="url(#colorVal)" animationDuration={2000} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DISTRIBUTION STRIP - REDISEÑADO A UNA COLUMNA PARA MEJOR LEGIBILIDAD */}
      <div className="bg-card border border-gray-800 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 lg:p-12 shadow-2xl overflow-hidden relative">
        {isDemo && <DemoWatermark />}
        <div className="flex items-center gap-4 mb-8 md:mb-10">
          <PieIcon size={28} className="text-violet" />
          <h3 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">Distribución por Categoría</h3>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
          <div className="lg:col-span-5 h-[250px] md:h-[350px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stats.sectorData} cx="50%" cy="50%" innerRadius={80} outerRadius={125} paddingAngle={8} dataKey="value" animationDuration={1000}>
                  {stats.sectorData.map((_, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1a1f26', border: 'none', borderRadius: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Cambiado sm:grid-cols-2 a grid-cols-1 para visualización en columna única */}
          <div className="lg:col-span-7 grid grid-cols-1 gap-5">
            {stats.sectorData.map((s, i) => (
              <div key={i} className="bg-[#1a1f26] border border-gray-800 p-5 md:p-7 rounded-[2rem] flex flex-col gap-3 transition-all hover:border-gray-700 shadow-xl group">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div 
                    className="w-3 h-3 rounded-full shrink-0 group-hover:scale-125 transition-transform" 
                    style={{ 
                        backgroundColor: COLORS[i % COLORS.length],
                        boxShadow: `0 0 10px ${COLORS[i % COLORS.length]}44`
                    }}
                  ></div>
                  <span className="text-[12px] md:text-[14px] font-black text-white uppercase tracking-tight truncate leading-tight">
                    {s.name}
                  </span>
                </div>
                
                <div className="flex items-end justify-between border-t border-gray-800/50 pt-3 mt-1">
                   <div className="flex flex-col">
                      <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Peso Relativo</span>
                      <div className="text-[10px] text-gray-500 font-bold font-mono mt-1">{s.value.toLocaleString()} €</div>
                   </div>
                   <div className="text-right">
                      <div className="text-lg md:text-xl font-black text-neon leading-none">{s.percent.toFixed(1)}%</div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RANKINGS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-card border border-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
          {isDemo && <DemoWatermark />}
          <div className="flex items-center gap-4 mb-8">
            <TrendingUp size={28} className="text-neon" />
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Activos Líderes</h3>
          </div>
          <div className="space-y-4">
            {stats.topFunds.map((f, i) => (
              <div key={i} className="p-6 bg-[#1a1f26] border border-gray-800 rounded-[2rem] flex justify-between items-center group hover:border-neon/40 transition-all">
                <div className="min-w-0 flex-1 pr-6">
                  <div className="text-[14px] font-black text-white truncate uppercase mb-1">{f.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono font-bold tracking-tight">{f.isin}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-neon font-black text-base">+{f.pPerc.toFixed(2)}%</div>
                  <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Retorno</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-gray-800 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative">
          {isDemo && <DemoWatermark />}
          <div className="flex items-center gap-4 mb-8">
            <TrendingDown size={28} className="text-red-500" />
            <h3 className="text-xl font-black text-white tracking-tight uppercase">Activos Rezagados</h3>
          </div>
          <div className="space-y-4">
            {stats.bottomFunds.map((f, i) => (
              <div key={i} className="p-6 bg-[#1a1f26] border border-gray-800 rounded-[2rem] flex justify-between items-center group hover:border-red-500/40 transition-all">
                <div className="min-w-0 flex-1 pr-6">
                  <div className="text-[14px] font-black text-white truncate uppercase mb-1">{f.name}</div>
                  <div className="text-[10px] text-gray-500 font-mono font-bold tracking-tight">{f.isin}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-base font-black ${f.pPerc >= 0 ? 'text-neon' : 'text-red-500'}`}>
                    {f.pPerc >= 0 ? '+' : ''}{f.pPerc.toFixed(2)}%
                  </div>
                  <div className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">Resultado</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const DemoWatermark = () => (
  <div className="absolute top-4 right-8 select-none pointer-events-none z-[5]">
    <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white/20 uppercase tracking-widest">Ejemplo / Demo</div>
  </div>
);

const KPI = ({ card, value, icon, trend, info, desc, color = 'text-white', isDemo }: any) => (
  <div className="bg-card border border-gray-800 p-8 rounded-[2rem] hover:border-neon/30 transition-all group shadow-2xl flex flex-col justify-between h-[190px] relative">
    {isDemo && <DemoWatermark />}
    <div className="flex justify-between items-start">
      <div className="p-4 rounded-2xl bg-[#1e2530] border border-gray-700 shadow-xl">{icon}</div>
      <div className="text-right">
        <span className="text-[10px] text-gray-500 uppercase font-black tracking-widest flex items-center justify-end">{card} <InfoTooltip text={info} /></span>
        {trend !== undefined && <div className={`text-[11px] font-black mt-2 ${trend >= 0 ? 'text-neon' : 'text-red-500'}`}>{trend >= 0 ? '↗' : '↘'} {Math.abs(trend).toFixed(2)}%</div>}
      </div>
    </div>
    <div className="mt-4">
      <div className={`text-2xl md:text-3xl font-black tracking-tight ${color} leading-none mb-4 whitespace-nowrap`}>
        {value.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 })}
      </div>
      <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest border-t border-gray-800/50 pt-4">{desc}</div>
    </div>
  </div>
);
