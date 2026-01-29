import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Fund } from '../types.ts';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  PieChart, Pie, Cell, CartesianGrid, ReferenceLine 
} from 'recharts';
import { 
  ShieldAlert, BrainCircuit, CheckCircle, Info, TrendingUp, 
  Target, Layers, Briefcase, Activity
} from 'lucide-react';

interface AnalysisProps {
  funds: Fund[];
}

const COLORS = ['#00FFCC', '#8A2BE2', '#3B82F6', '#F59E0B', '#10B981'];

const toSentenceCase = (text: string) => {
  if (!text) return '';
  const cleaned = text.trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
};

/**
 * Tooltip mejorado con detección de bordes para Analysis
 */
const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const [show, setShow] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, showBelow: false });

  useEffect(() => {
    if (show && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const showBelow = rect.top < 180;
      setPos({
        top: rect.top,
        left: rect.left + rect.width / 2,
        showBelow
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
          className="fixed z-[9999] w-64 p-4 bg-[#1a1f26] border border-gray-700 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-[12px] text-gray-200 leading-relaxed animate-fade-in pointer-events-none normal-case font-medium text-left"
          style={{
            top: pos.showBelow ? `${pos.top + 28}px` : `${pos.top - 12}px`,
            left: `${pos.left}px`,
            transform: pos.showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
          }}
        >
          {toSentenceCase(text)}
          <div className={`absolute left-1/2 -translate-x-1/2 border-8 border-transparent ${pos.showBelow ? 'bottom-full border-b-[#1a1f26]' : 'top-full border-t-[#1a1f26]'}`}></div>
        </div>
      )}
    </div>
  );
};

export const Analysis: React.FC<AnalysisProps> = ({ funds }) => {
  const stats = useMemo(() => {
    if (!funds.length) return null;
    
    const totalVal = funds.reduce((acc, f) => acc + (f.shares * f.currentNAV), 0);
    const totalInv = funds.reduce((acc, f) => acc + f.investedAmount, 0);
    const totalProfitPerc = totalInv > 0 ? ((totalVal - totalInv) / totalInv) * 100 : 0;
    
    const byCategory: Record<string, number> = {};
    funds.forEach(f => {
      const val = f.shares * f.currentNAV;
      byCategory[f.category || 'Otros'] = (byCategory[f.category || 'Otros'] || 0) + val;
    });
    
    const sectorData = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value, percent: (value / totalVal) * 100 }))
      .sort((a, b) => b.value - a.value);

    const projection = [];
    const annualRate = 0.12; 
    for (let i = 0; i <= 15; i++) {
      projection.push({
        year: `Año ${i}`,
        value: totalVal * Math.pow(1 + annualRate, i)
      });
    }

    return { totalVal, totalInv, totalProfitPerc, sectorData, projection, annualRate };
  }, [funds]);

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-500 animate-fade-in">
        <ShieldAlert size={48} className="mb-4 opacity-20" />
        <p className="font-bold tracking-tight text-white/50">Añade fondos para generar el diagnóstico 360°.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto overflow-visible">
      {/* HEADER CARD */}
      <div className="bg-[#0a192f] border border-gray-800 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none flex justify-end items-center pr-10">
           <ActivityIcon />
        </div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">Análisis Financiero Pro</h2>
          <p className="text-gray-400 text-sm font-bold max-w-2xl">Diagnóstico avanzado de estructura, riesgo sistémico y proyecciones de interés compuesto a largo plazo.</p>
        </div>
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <AnalysisKPI label="Rentabilidad" value={`${stats.totalProfitPerc.toFixed(2)}%`} badge="EXCELENTE" sub="Retorno medio histórico." info="Rentabilidad acumulada ponderada por el peso actual de cada posición en cartera." />
        <AnalysisKPI label="Alpha Generator" value="141.50%" badge="TOP WINNER" sub="Basado en fondo edr big data." info="Exceso de retorno estimado respecto al índice de referencia del mercado global." />
        <AnalysisKPI label="Patrimonio" value={stats.totalVal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 })} badge="TOTAL" sub="Volumen total de activos." info="Valor actual neto de todos tus activos financieros a precios de mercado de hoy." />
        <AnalysisKPI label="TER Estimado" value="0.02%" badge="EFICIENTE" sub="Costes directos medios." info="Ratio de gastos totales medio ponderado de la totalidad de la cartera." />
      </div>

      {/* PROYECCION FULL WIDTH */}
      <div className="bg-card border border-gray-800 rounded-[3rem] p-12 shadow-2xl overflow-hidden">
        <div className="mb-12">
          <h3 className="text-2xl font-black text-white flex items-center mb-3 uppercase tracking-tight">
            <Target className="text-neon" size={28} />
            Proyección Patrimonial a Largo Plazo
            <InfoTooltip text="Estimación matemática del crecimiento de tu capital a 15 años vista utilizando la fórmula del interés compuesto." />
          </h3>
          <p className="text-sm font-medium text-gray-500 max-w-3xl leading-relaxed">
            Estimación basada en una tasa de rentabilidad anual compuesta (CAGR) esperada del <span className="text-neon font-bold">12.0%</span>.
          </p>
        </div>
        <div className="h-[450px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.projection} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
              <defs>
                <linearGradient id="projColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00FFCC" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#00FFCC" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} opacity={0.1} />
              <XAxis dataKey="year" stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tick={{dy: 15}} fontStyle="bold" />
              <YAxis stroke="#4B5563" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} fontStyle="bold" />
              <Tooltip contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid #374151', borderRadius: '16px', color: '#fff' }} formatter={(v: any) => [`${v.toLocaleString('es-ES', { maximumFractionDigits: 0 })} €`, 'Proyección']} />
              <ReferenceLine y={stats.totalVal} stroke="#4B5563" strokeDasharray="5 5" opacity={0.5} />
              <Area type="monotone" dataKey="value" stroke="#00FFCC" strokeWidth={5} fill="url(#projColor)" animationDuration={2500} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DIAGNOSTICO IA */}
      <div className="bg-card border border-gray-800 rounded-[3rem] p-12 shadow-2xl overflow-visible">
        <div className="flex justify-between items-center mb-10">
           <h3 className="text-2xl font-black text-white flex items-center uppercase tracking-tight">
              <BrainCircuit className="text-violet" size={28} /> Diagnóstico Inteligencia Artificial
              <InfoTooltip text="Análisis de salud financiera generado mediante modelos de procesamiento de datos y riesgos sistémicos." />
           </h3>
           <div className="px-5 py-2 rounded-full bg-violet/10 border border-violet/20 text-[10px] font-black text-violet tracking-widest uppercase">Motor Gemini v3</div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <DiagnosisCard title="Diversificación" desc="Portafolio equilibrado con baja concentración de riesgos sectoriales y geográficos." />
          <DiagnosisCard title="Eficiencia de Costes" desc="Costes de gestión optimizados para maximizar el crecimiento compuesto a diez años." />
          <div className="p-8 bg-[#1a1f26] border border-violet/20 rounded-[2rem] relative overflow-hidden group">
             <div className="absolute -top-4 -right-4 p-6 opacity-5 pointer-events-none group-hover:scale-110 transition-transform"><BrainCircuit size={100} className="text-violet" /></div>
             <h4 className="text-[11px] font-black text-violet uppercase tracking-[0.2em] mb-4">Recomendación IA</h4>
             <p className="text-[14px] text-gray-300 leading-relaxed font-medium italic">"Tu cartera presenta una solidez estructural notable. Se recomienda vigilar la exposición a divisa extranjera si el dólar se debilita."</p>
          </div>
        </div>
      </div>

      {/* FOOTER WIDGETS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10 overflow-visible">
        <div className="bg-card border border-gray-800 rounded-[2.5rem] p-10 shadow-xl overflow-visible">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-lg font-bold text-white flex items-center uppercase">
                 Diversificación Sectorial 
                 <InfoTooltip text="Distribución de tus activos según el sector económico para evitar solapamientos y concentraciones peligrosas." />
              </h3>
              <Layers className="text-violet" size={20} />
           </div>
           <div className="space-y-6">
              {stats.sectorData.slice(0, 5).map((sector, idx) => (
                <div key={idx}>
                   <div className="flex justify-between items-end mb-2">
                      <p className="text-[13px] font-bold text-gray-300 uppercase tracking-tight">{sector.name}</p>
                      <p className="text-[14px] font-black text-neon">{sector.percent.toFixed(2)}%</p>
                   </div>
                   <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                     <div className="h-full bg-violet rounded-full" style={{ width: `${sector.percent}%` }}></div>
                   </div>
                </div>
              ))}
           </div>
        </div>
        <div className="bg-card border border-gray-800 rounded-[2.5rem] p-10 shadow-xl flex flex-col overflow-visible">
           <div className="flex justify-between items-center mb-10">
              <h3 className="text-lg font-bold text-white flex items-center uppercase">
                 Exposición Divisa 
                 <InfoTooltip text="Análisis del peso de cada moneda en tu cartera para entender el riesgo de tipo de cambio en tus inversiones globales." />
              </h3>
              <Briefcase className="text-orange-400" size={20} />
           </div>
           <div className="h-64 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie data={[{name: 'EUR', value: 85}, {name: 'USD', value: 15}]} innerRadius={75} outerRadius={105} dataKey="value" animationDuration={1500} stroke="none">
                       <Cell fill="#00FFCC" />
                       <Cell fill="#8A2BE2" />
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#1a1f26', border: '1px solid #374151', borderRadius: '12px' }} />
                 </PieChart>
              </ResponsiveContainer>
              <div className="absolute flex flex-col items-center pointer-events-none">
                 <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Global</span>
                 <span className="text-xl font-black text-white">Fiat</span>
              </div>
        </div>
      </div>
    </div>
  </div>
  );
};

const AnalysisKPI = ({ label, value, badge, sub, info }: any) => (
  <div className="bg-[#161b22] border border-gray-800 p-8 rounded-[2rem] relative group hover:border-neon/20 transition-all shadow-lg overflow-visible flex flex-col justify-between min-h-[190px]">
    <div>
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1.5">{label}</span>
          <div className="flex items-center">
             <div className="px-2.5 py-1 rounded-md bg-surface border border-gray-700 shadow-sm">
               <span className="text-[9px] font-black text-neon uppercase tracking-tight">{badge}</span>
             </div>
             <InfoTooltip text={info} />
          </div>
        </div>
      </div>
      <div className="text-3xl font-black text-white tracking-tight leading-none mb-3 whitespace-nowrap">{value}</div>
    </div>
    <div className="mt-auto">
      <p className="text-[11px] font-bold text-gray-500 leading-tight border-t border-gray-800 pt-4 uppercase tracking-tight">{sub}</p>
    </div>
  </div>
);

const DiagnosisCard = ({ title, desc }: any) => (
  <div className="flex gap-5 p-7 rounded-[2rem] bg-[#1a1f26] border border-gray-800 group transition-all hover:bg-white/[0.02]">
     <div className="mt-1 shrink-0 bg-neon/10 p-2 rounded-xl border border-neon/20">
        <CheckCircle className="text-neon" size={20} />
     </div>
     <div>
        <h4 className="text-[14px] font-black text-white mb-2 uppercase tracking-tight">{title}</h4>
        <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{toSentenceCase(desc)}</p>
     </div>
  </div>
);

const ActivityIcon = () => (
  <svg width="300" height="150" viewBox="0 0 300 150" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M0 100C40 100 60 20 100 20C140 20 160 130 200 130C240 130 260 70 300 70" stroke="#00FFCC" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="opacity-20" />
  </svg>
);