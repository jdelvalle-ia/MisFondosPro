import React, { useState, useMemo } from 'react';
import { Fund, HistoryPoint } from '../types.ts';
import { 
  RefreshCw, Search, Plus, Trash2, Edit2, Eye, ArrowLeft, Loader2, 
  X, Target, GripVertical, Save
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
              history: fullData.history as HistoryPoint[]
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
          history: fullData.history as HistoryPoint[]
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
                const profitPerc = (profit / fund.investedAmount) * 100;
                const weight = (currentVal / totalPortfolioValue) * 100;

                return (
                  <tr key={fund.isin} className="group hover:bg-white/[0.02] transition-colors relative">
                    <td className="py-6 px-3"><GripVertical size={16} className="text-gray-700 mx-auto" /></td>
                    <td className="py-6 px-2">
                      <div className="text-neon font-black text-[11px] mb-1 truncate max-w-[220px] uppercase tracking-tighter">{fund.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-gray-500 font-mono tracking-tight">{fund.isin}</span>
                        <div className="flex gap-2.5 opacity-0 group-hover:opacity-100 transition-all ml-2">
                           <button onClick={() => { setSelectedFund(fund); setViewMode('detail'); }} className="text-gray-400 hover:text-white" title="Ver Detalle"><Eye size={12} /></button>
                           <button onClick={() => handleUpdateFundNAV(fund)} className="text-gray-400 hover:text-white" title="Actualizar VL">
                             {updatingIsin === fund.isin ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                           </button>
                           <button onClick={() => { setEditingFund(fund); setFormData(fund); setIsModalOpen(true); }} className="text-gray-400 hover:text-white" title="Editar Activo"><Edit2 size={12} /></button>
                           <button onClick={() => onDeleteFund(fund.isin)} className="text-gray-400 hover:text-red-500" title="Eliminar"><Trash2 size={12} /></button>
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

      {isModalOpen && <FundModal fund={formData} isEditing={!!editingFund} onClose={() => setIsModalOpen(false)} onSave={(f) => {
        if (editingFund) onEditFund(f); else onAddFund(f);
        setIsModalOpen(false);
      }} />}
    </div>
  );
};

const FundModal = ({ fund, isEditing, onClose, onSave }: any) => {
  const [data, setData] = useState(fund);
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0d1117] border border-gray-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-slide-up">
        <div className="px-8 py-6 border-b border-gray-800 flex justify-between items-center">
          <h3 className="text-xl font-black text-white uppercase tracking-tight">{isEditing ? 'Editar Activo' : 'Nuevo Activo'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
        </div>
        <div className="p-8 grid grid-cols-2 gap-4">
           <Input label="ISIN" value={data.isin} onChange={v => setData({...data, isin: v})} />
           <Input label="NOMBRE" value={data.name} onChange={v => setData({...data, name: v})} />
           <Input label="INVERSIÓN (€)" type="number" value={data.investedAmount} onChange={v => setData({...data, investedAmount: parseFloat(v)})} />
           <Input label="PARTICIPACIONES" type="number" value={data.shares} onChange={v => setData({...data, shares: parseFloat(v)})} />
           <Input label="VALOR ACTUAL (VL)" type="number" value={data.currentNAV} onChange={v => setData({...data, currentNAV: parseFloat(v)})} />
           <Input label="FECHA COMPRA" type="date" value={data.buyDate} onChange={v => setData({...data, buyDate: v})} />
        </div>
        <div className="px-8 py-6 bg-[#161b22] flex justify-end gap-4 border-t border-gray-800">
          <button onClick={onClose} className="text-gray-400 font-bold text-sm">Cerrar</button>
          <button onClick={() => onSave(data)} className="bg-neon text-black font-black px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 hover:bg-neon/90 transition-colors"><Save size={16} /> Guardar Cambios</button>
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, value, onChange, type = "text" }: any) => (
  <div>
    <label className="block text-[10px] font-black text-gray-500 uppercase mb-1.5 ml-1 tracking-wider">{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-[#161b22] border border-gray-800 rounded-xl px-4 py-3 text-sm text-white focus:border-neon outline-none transition-all" />
  </div>
);

const DetailView = ({ fund, onBack }: { fund: Fund, onBack: () => void }) => {
  const monthlyData = useMemo(() => {
    if (!fund.history) return [];
    return [...processHistoryData(fund.history, fund)].reverse();
  }, [fund.history, fund]);

  return (
    <div className="animate-fade-in space-y-8 pb-20 w-full overflow-hidden">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-white font-black text-[10px] uppercase transition-all tracking-widest">
        <ArrowLeft size={16} /> Volver a Cartera
      </button>

      <div className="flex items-end gap-6 flex-wrap">
         <h2 className="text-3xl font-black text-white uppercase tracking-tight">{fund.name}</h2>
         <span className="text-xs font-bold text-gray-600 font-mono tracking-widest">{fund.isin}</span>
      </div>

      <div className="bg-[#161b22] border border-gray-800 rounded-3xl p-10 shadow-2xl overflow-hidden">
         <h3 className="text-lg font-bold text-white mb-10 uppercase tracking-tight">Histórico de Valoración (24 Meses)</h3>
         <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={[...monthlyData].reverse()}>
                  <defs><linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.25}/><stop offset="95%" stopColor="#8A2BE2" stopOpacity={0}/></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} opacity={0.1} />
                  <XAxis dataKey="date" stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4B5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <RechartsTooltip contentStyle={{ backgroundColor: '#161b22', border: '1px solid #374151', borderRadius: '16px' }} />
                  <Area type="monotone" dataKey="value" stroke="#8A2BE2" strokeWidth={4} fill="url(#colorValue)" />
               </AreaChart>
            </ResponsiveContainer>
         </div>
      </div>
    </div>
  );
};