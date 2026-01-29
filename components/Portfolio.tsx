import React, { useState, useMemo } from 'react';
import { Fund, HistoryPoint } from '../types.ts';
import { 
  RefreshCw, Search, Plus, Trash2, Edit2, Eye, ArrowLeft, Loader2, 
  X, Target, GripVertical, Save, Briefcase, Globe, Percent, Calendar,
  Table as TableIcon, TrendingUp, Info, Activity, Layers
} from 'lucide-react';
import { geminiService } from '../services/geminiService.ts';
import { processHistoryData } from '../utils/fundUtils.ts';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip } from 'recharts';
import { logger } from '../services/loggerService.ts';

interface PortfolioProps {
  funds: Fund[];
  portfolioName: string;
  onUpdatePortfolioName: (name: string) => void;
  onFundsUpdate: (funds: Fund[]) => void;
  onSyncComplete?: (funds: Fund[]) => void;
  onAddFund: (fund: Fund) => void;
  onEditFund: (fund: Fund) => void;
  onDeleteFund: (isin: string) => void;
}

const EMPTY_FUND: Fund = { 
  isin: '', name: '', manager: '', category: '', 
  buyDate: new Date().toISOString().split('T')[0], 
  investedAmount: 0, currency: 'EUR', shares: 0, fees: 0, 
  currentNAV: 0, lastUpdated: new Date().toISOString().split('T')[0]
};

export const Portfolio: React.FC<PortfolioProps> = ({ 
  funds, portfolioName, onUpdatePortfolioName, onFundsUpdate, onSyncComplete, onAddFund, onEditFund, onDeleteFund 
}) => {
  const [updatingIsin, setUpdatingIsin] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ current: number, total: number, isin: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFund, setEditingFund] = useState<Fund | null>(null);
  const [formData, setFormData] = useState<Fund>(EMPTY_FUND);
  const [isEditingName, setIsEditingName] = useState(false);

  const totalPortfolioValue = useMemo(() => {
    return funds.reduce((acc, fund) => acc + ((fund.shares || 0) * (fund.currentNAV || 0)), 0);
  }, [funds]);

  const handleGlobalUpdate = async () => {
    if (funds.length === 0 || syncStatus) return;
    logger.info(`Iniciando actualización masiva de ${funds.length} activos...`);
    
    const updatedFundsList = [...funds];
    try {
        for (let i = 0; i < updatedFundsList.length; i++) {
            const fund = updatedFundsList[i];
            setSyncStatus({ current: i + 1, total: funds.length, isin: fund.isin });
            
            const fullData = await geminiService.getFundFullData(fund);
            if (!fullData) {
              throw new Error(`CRÍTICO: Fallo al obtener datos de ${fund.isin}. Proceso abortado.`);
            }

            updatedFundsList[i] = { 
              ...fund, 
              currentNAV: fullData.current.nav, 
              lastUpdated: fullData.current.date,
              history: fullData.history as any
            };
            logger.success(`[OK] ${fund.isin} actualizado.`);
        }
        
        if (onSyncComplete) onSyncComplete(updatedFundsList);
        else onFundsUpdate(updatedFundsList);
        logger.success(`Sincronización masiva finalizada.`);
    } catch (e: any) {
        logger.error(e.message || "Error fatal en la sincronización.");
    } finally {
        setSyncStatus(null);
    }
  };

  const handleUpdateFundNAV = async (fund: Fund) => {
    setUpdatingIsin(fund.isin);
    try {
      const fullData = await geminiService.getFundFullData(fund);
      if (fullData) {
        onEditFund({ 
          ...fund, currentNAV: fullData.current.nav, 
          lastUpdated: fullData.current.date, 
          history: fullData.history as any
        });
        logger.success(`NAV actualizado para ${fund.isin}`);
      }
    } catch (e) {
      logger.error(`Error actualizando ${fund.isin}`);
    } finally {
      setUpdatingIsin(null);
    }
  };

  const filteredFunds = funds.filter(fund => 
    fund.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    fund.isin.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenDetail = (fund: Fund) => {
    setSelectedFund(fund);
    setViewMode('detail');
  };

  if (viewMode === 'detail' && selectedFund) {
    return <DetailView fund={selectedFund} onBack={() => setViewMode('list')} />;
  }

  return (
    <div className="space-y-6 animate-fade-in w-full pb-10 overflow-hidden">
      <div className="flex flex-col space-y-6">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Buscar por ISIN o Nombre..." 
            className="w-full bg-[#1a1f26] border border-gray-800 rounded-xl pl-12 pr-4 py-4 text-sm focus:border-neon transition-all text-gray-300"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <div className="bg-[#1a1f26] border border-gray-800 px-6 py-3 rounded-xl flex items-center gap-2 max-w-full">
            <span className="text-[10px] font-black text-gray-500 uppercase shrink-0">CARTERA:</span>
            {isEditingName ? (
              <input autoFocus className="bg-transparent border-b border-neon outline-none text-white font-black text-sm w-full min-w-[150px]" value={portfolioName} onChange={(e) => onUpdatePortfolioName(e.target.value)} onBlur={() => setIsEditingName(false)} />
            ) : (
              <span className={`text-sm font-black cursor-pointer truncate max-w-[250px] ${!portfolioName ? 'text-gray-500 italic' : 'text-white uppercase'}`} onClick={() => setIsEditingName(true)}>
                {portfolioName || 'CARTERA SIN TÍTULO'}
              </span>
            )}
          </div>
          <button onClick={() => { setEditingFund(null); setFormData(EMPTY_FUND); setIsModalOpen(true); }} className="bg-neon text-black font-black px-8 py-3 rounded-xl text-sm hover:bg-neon/90 transition-colors">Añadir Fondo</button>
          <button onClick={handleGlobalUpdate} disabled={!!syncStatus} className="bg-[#2d1b4d] text-violet border border-violet/30 font-black px-8 py-3 rounded-xl text-sm disabled:opacity-50 flex items-center gap-2">
            <RefreshCw size={18} className={syncStatus ? 'animate-spin' : ''} />
            {syncStatus ? `${syncStatus.current}/${syncStatus.total}` : 'Actualizar Todo'}
          </button>
        </div>
      </div>

      <div className="bg-[#0b0e11] border border-gray-800/50 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800/50">
                <th className="py-6 px-3 w-10"></th>
                <th className="py-6 px-2">FONDO / ISIN</th>
                <th className="py-6 px-2 text-right">INVERSIÓN</th>
                <th className="py-6 px-2 text-right">VALOR ACTUAL</th>
                <th className="py-6 px-2 text-right">RENTABILIDAD</th>
                <th className="py-6 px-4 text-right">% PESO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/30">
              {filteredFunds.map((fund) => {
                const currentVal = fund.shares * fund.currentNAV;
                const profit = currentVal - fund.investedAmount;
                const profitPerc = fund.investedAmount > 0 ? (profit / fund.investedAmount) * 100 : 0;
                const weight = totalPortfolioValue > 0 ? (currentVal / totalPortfolioValue) * 100 : 0;

                return (
                  <tr key={fund.isin} className="group hover:bg-white/[0.02] transition-colors relative cursor-default">
                    <td className="py-6 px-3"><GripVertical size={16} className="text-gray-700 mx-auto" /></td>
                    <td className="py-6 px-2">
                      <div className="text-neon font-black text-[11px] mb-1 truncate max-w-[220px] uppercase tracking-tighter">{fund.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-500 font-mono tracking-tight">{fund.isin}</span>
                        {/* ICONOS SIEMPRE VISIBLES POR PETICIÓN */}
                        <div className="flex gap-2.5 ml-2">
                           <button onClick={() => handleOpenDetail(fund)} className="text-gray-500 hover:text-white transition-colors" title="Ver Detalle"><Eye size={12} /></button>
                           <button onClick={() => handleUpdateFundNAV(fund)} className="text-gray-500 hover:text-white transition-colors" title="Actualizar VL">
                             {updatingIsin === fund.isin ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                           </button>
                           <button onClick={() => { setEditingFund(fund); setFormData(fund); setIsModalOpen(true); }} className="text-gray-500 hover:text-white transition-colors" title="Editar Activo"><Edit2 size={12} /></button>
                           <button onClick={() => onDeleteFund(fund.isin)} className="text-gray-500 hover:text-red-500 transition-colors" title="Eliminar"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </td>
                    <td className="py-6 px-2 text-right font-bold text-gray-400 text-xs whitespace-nowrap">{fund.investedAmount.toLocaleString()} €</td>
                    <td className="py-6 px-2 text-right">
                      <div className="text-white font-black text-xs whitespace-nowrap">{currentVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} €</div>
                      <div className="text-[8px] text-gray-600 font-bold">{fund.lastUpdated}</div>
                    </td>
                    <td className={`py-6 px-2 text-right font-black text-xs whitespace-nowrap ${profit >= 0 ? 'text-neon' : 'text-red-500'}`}>
                      {profit >= 0 ? '+' : ''}{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })} € ({profitPerc.toFixed(1)}%)
                    </td>
                    <td className="py-6 px-4 text-right">
                       <div className="text-white font-black text-xs">{weight.toFixed(1)}%</div>
                       <div className="w-12 ml-auto h-1 bg-gray-800 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-violet" style={{ width: `${weight}%` }}></div>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <FundModal 
          fund={formData} 
          isEditing={!!editingFund} 
          onClose={() => setIsModalOpen(false)} 
          onSave={(f) => {
            if (editingFund) onEditFund(f); else onAddFund(f);
            setIsModalOpen(false);
          }} 
        />
      )}
    </div>
  );
};

const FundModal = ({ fund, isEditing, onClose, onSave }: any) => {
  const [data, setData] = useState(fund);
  
  const handleSubmit = () => {
    const sanitized = {
      ...data,
      investedAmount: Number(data.investedAmount),
      shares: Number(data.shares),
      currentNAV: Number(data.currentNAV),
      fees: Number(data.fees)
    };
    onSave(sanitized);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0d1117] border border-gray-800 rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="px-8 py-6 border-b border-gray-800 flex justify-between items-center bg-[#0d1117]/80 backdrop-blur-md">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">{isEditing ? 'Configurar Activo' : 'Nuevo Activo'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        
        <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* GRUPO 1: DATOS DEL FONDO */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800/50 pb-2">
              <Briefcase size={16} className="text-neon" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Datos del Fondo</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="ISIN" value={data.isin} onChange={v => setData({...data, isin: v})} />
              <Input label="Nombre del Fondo" value={data.name} onChange={v => setData({...data, name: v})} />
              <Input label="Gestora (Manager)" value={data.manager} onChange={v => setData({...data, manager: v})} />
              <Input label="Categoría" value={data.category} onChange={v => setData({...data, category: v})} />
              <Input label="Divisa" value={data.currency} onChange={v => setData({...data, currency: v})} />
            </div>
          </div>

          {/* GRUPO 2: DATOS DE LA OPERACIÓN */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-b border-gray-800/50 pb-2">
              <Calendar size={16} className="text-violet" />
              <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Datos de la Operación</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Fecha de Compra" type="date" value={data.buyDate} onChange={v => setData({...data, buyDate: v})} />
              <Input label="Inversión Inicial (€)" type="number" value={data.investedAmount} onChange={v => setData({...data, investedAmount: v})} />
              <Input label="Participaciones" type="number" value={data.shares} onChange={v => setData({...data, shares: v})} />
              <Input label="Comisiones (%)" type="number" value={data.fees} onChange={v => setData({...data, fees: v})} />
            </div>
          </div>

          {/* GRUPO 3: DATOS ACTUALES (Sólo Edición) */}
          {isEditing && (
            <div>
              <div className="flex items-center gap-2 mb-4 border-b border-gray-800/50 pb-2">
                <Activity size={16} className="text-blue-400" />
                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Datos Actuales de Mercado</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Fecha último NAV" type="date" value={data.lastUpdated} onChange={v => setData({...data, lastUpdated: v})} />
                <Input label="Valor Liquidativo Actual (NAV)" type="number" value={data.currentNAV} onChange={v => setData({...data, currentNAV: v})} />
              </div>
            </div>
          )}
        </div>

        <div className="px-8 py-6 bg-[#161b22] flex justify-end gap-4 border-t border-gray-800">
          <button onClick={onClose} className="text-gray-400 font-bold text-sm hover:text-white transition-colors">Cancelar</button>
          <button onClick={handleSubmit} className="bg-neon text-black font-black px-8 py-3 rounded-xl text-sm flex items-center gap-2 hover:bg-neon/90 transition-all shadow-lg shadow-neon/10">
            <Save size={18} /> {isEditing ? 'Actualizar Activo' : 'Dar de Alta'}
          </button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>
    <input 
      type={type} 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-neon outline-none transition-all placeholder:text-gray-700" 
      placeholder={`Ingresar ${label.toLowerCase()}...`}
    />
  </div>
);

const DetailView = ({ fund, onBack }: { fund: Fund, onBack: () => void }) => {
  const processedData = useMemo(() => {
    if (!fund.history || fund.history.length === 0) return [];
    return processHistoryData(fund.history as any, fund);
  }, [fund.history, fund]);

  const tabularHistory = useMemo(() => [...processedData].reverse(), [processedData]);

  const currentVal = fund.shares * fund.currentNAV;
  const profit = currentVal - fund.investedAmount;
  const profitPerc = fund.investedAmount > 0 ? (profit / fund.investedAmount) * 100 : 0;

  return (
    <div className="animate-fade-in space-y-8 pb-20 w-full overflow-hidden">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-[10px] uppercase transition-all tracking-widest mb-4">
        <ArrowLeft size={16} /> Volver a Cartera
      </button>

      {/* CABECERA OPTIMIZADA */}
      <div className="bg-[#161b22]/50 p-8 md:p-10 rounded-[2.5rem] border border-gray-800/50 shadow-2xl space-y-8">
         {/* FILA 1: NOMBRE COMPLETO (COMPACTO) */}
         <div className="w-full border-b border-gray-800 pb-6">
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight leading-none truncate" title={fund.name}>
              {fund.name}
            </h2>
         </div>

         {/* FILA 2: DATOS TÉCNICOS Y FINANCIEROS (REORGANIZADOS) */}
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
            {/* IZQUIERDA: ISIN, GESTORA Y COMPRA */}
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest w-16">ISIN:</span>
                  <span className="text-xs font-bold text-gray-200 font-mono tracking-widest">{fund.isin}</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest w-16">GESTORA:</span>
                  <span className="bg-neon/10 text-neon px-3 py-0.5 rounded-lg text-[10px] font-black border border-neon/20 uppercase tracking-tighter">
                    {fund.manager}
                  </span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest w-16">COMPRA:</span>
                  <div className="flex items-center gap-2 text-gray-300 font-bold uppercase text-[10px] tracking-wider">
                     <Calendar size={12} className="text-violet" /> {fund.buyDate}
                  </div>
               </div>
            </div>

            {/* DERECHA: CAJAS DE DATOS FINANCIEROS */}
            <div className="flex flex-wrap gap-4 shrink-0 w-full lg:w-auto">
               <div className="bg-[#0b0e11] border border-gray-800 p-5 rounded-3xl min-w-[180px] shadow-inner">
                  <div className="text-[9px] font-black text-gray-500 uppercase mb-2 tracking-widest">Valoración Actual</div>
                  <div className="text-2xl font-black text-white whitespace-nowrap overflow-hidden flex items-baseline gap-2">
                     {currentVal.toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-neon text-sm">€</span>
                  </div>
               </div>
               <div className="bg-[#0b0e11] border border-gray-800 p-5 rounded-3xl min-w-[180px] shadow-inner">
                  <div className="text-[9px] font-black text-gray-500 uppercase mb-2 tracking-widest">Rentabilidad Total</div>
                  <div className={`text-2xl font-black flex items-baseline gap-2 ${profit >= 0 ? 'text-neon' : 'text-red-500'}`}>
                     {profit >= 0 ? '+' : ''}{profitPerc.toFixed(2)} <span className="text-sm">%</span>
                  </div>
               </div>
            </div>
         </div>
      </div>

      {/* GRÁFICO DE EVOLUCIÓN */}
      <div className="bg-[#161b22] border border-gray-800 rounded-[3rem] p-10 lg:p-14 shadow-2xl relative overflow-hidden">
         <div className="flex justify-between items-center mb-12">
            <div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                  <TrendingUp className="text-neon" size={28} /> Evolución del Valor (Datos Reales)
               </h3>
               <p className="text-gray-500 text-sm font-medium mt-1 italic">Análisis patrimonial histórico basado en registros de mercado.</p>
            </div>
         </div>

         {processedData.length > 0 ? (
            <div className="h-[400px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={processedData}>
                     <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.25}/>
                           <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} opacity={0.1} />
                     <XAxis 
                        dataKey="date" 
                        stroke="#4B5563" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tick={{ dy: 10 }}
                        tickFormatter={(str) => {
                           const d = new Date(str);
                           return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' }).toUpperCase();
                        }}
                     />
                     <YAxis 
                        stroke="#4B5563" 
                        fontSize={10} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} 
                     />
                     <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#161b22', border: '1px solid #374151', borderRadius: '16px' }} 
                        labelStyle={{ color: '#9ca3af', fontWeight: 'bold', marginBottom: '8px' }}
                        formatter={(v: any) => [`${v.toLocaleString()} €`, 'Patrimonio']}
                     />
                     <Area type="monotone" dataKey="value" stroke="#8A2BE2" strokeWidth={5} fill="url(#colorValue)" animationDuration={1500} />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         ) : (
            <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-gray-800 rounded-3xl text-gray-600">
               <RefreshCw size={48} className="mb-4 opacity-20" />
               <p className="font-bold text-sm">Sin datos históricos disponibles.</p>
               <p className="text-[10px] mt-1 uppercase tracking-widest">Ejecuta una sincronización para recuperar el histórico.</p>
            </div>
         )}
      </div>

      {/* TABLA DE DESGLOSE HISTÓRICO - FORMATO AAAA-MM-DD */}
      <div className="bg-[#0b0e11] border border-gray-800 rounded-[2.5rem] overflow-hidden shadow-2xl">
         <div className="px-10 py-8 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-3">
               <TableIcon className="text-violet" size={24} /> Histórico de Valoraciones
            </h3>
         </div>
         <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
               <thead>
                  <tr className="text-[9px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-800/50 bg-[#161b22]/30">
                     <th className="py-5 px-10">FECHA REGISTRO</th>
                     <th className="py-5 px-6 text-right">VALOR LIQUIDATIVO (NAV)</th>
                     <th className="py-5 px-6 text-right">VALOR TOTAL</th>
                     <th className="py-5 px-10 text-right">RENDIMIENTO YTD</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-800/30">
                  {tabularHistory.length > 0 ? (
                     tabularHistory.map((point, i) => (
                        <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                           <td className="py-5 px-10">
                              <span className="text-white font-mono text-xs font-bold tracking-tight">
                                 {point.date}
                              </span>
                           </td>
                           <td className="py-5 px-6 text-right font-mono text-gray-400 text-xs">
                              {point.nav.toLocaleString(undefined, { minimumFractionDigits: 4 })} {fund.currency}
                           </td>
                           <td className="py-5 px-6 text-right font-black text-white text-xs">
                              {point.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} €
                           </td>
                           <td className="py-5 px-10 text-right">
                              <span className={`text-xs font-black ${point.ytdPercent >= 0 ? 'text-neon' : 'text-red-500'}`}>
                                 {point.ytdPercent >= 0 ? '↗' : '↘'} {point.ytdPercent.toFixed(2)}%
                              </span>
                           </td>
                        </tr>
                     ))
                  ) : (
                     <tr>
                        <td colSpan={4} className="py-20 text-center text-gray-600 font-bold uppercase text-[10px] tracking-widest italic">
                           No hay registros históricos disponibles.
                        </td>
                     </tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
