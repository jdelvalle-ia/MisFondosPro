import React, { useRef, useState } from 'react';
import { Database, Upload, Download, CheckCircle, RefreshCw, Wifi, CloudLightning, Zap, FileCode, Clock, ExternalLink, Key } from 'lucide-react';
import { Fund, HistoryPoint } from '../types.ts';
import { storageService } from '../services/storageService.ts';
import { geminiService } from '../services/geminiService.ts';
import { logger } from '../services/loggerService.ts';
import { GoogleGenAI } from "@google/genai";

interface SettingsProps {
  currentFunds: Fund[];
  currentPortfolioName: string;
  lastSyncDate?: string;
  onImportData: (data: { funds: Fund[], portfolioName: string, lastSyncDate?: string }) => void;
  onFundsUpdate: (funds: Fund[]) => void;
  onSyncComplete?: (funds: Fund[]) => void;
}

// Fix: Using 'any' for aistudio to avoid conflicts with pre-defined global types in the environment
declare global {
  interface Window {
    aistudio: any;
  }
}

export const Settings: React.FC<SettingsProps> = ({ 
  currentFunds, currentPortfolioName, lastSyncDate, onImportData, onFundsUpdate, onSyncComplete 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ current: number, total: number, isin: string } | null>(null);
  const [apiStatus, setApiStatus] = useState<'idle' | 'checking' | 'active' | 'error'>('idle');

  const formattedSyncDate = lastSyncDate ? new Date(lastSyncDate).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }) : 'Nunca sincronizado';

  const handleGlobalUpdate = async () => {
    if (currentFunds.length === 0 || syncStatus) return;
    
    // Verificar si hay una key seleccionada antes de empezar
    if (window.aistudio) {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        logger.warn("Se requiere una API Key configurada para usar el motor de búsqueda.");
        await window.aistudio.openSelectKey();
      }
    }

    logger.info(`Sincronización masiva desde configuración...`);
    
    const updatedFundsList = [...currentFunds];
    try {
        for (let i = 0; i < updatedFundsList.length; i++) {
            const fund = updatedFundsList[i];
            const startTime = performance.now();
            setSyncStatus({ current: i + 1, total: currentFunds.length, isin: fund.isin });
            
            const fullData = await geminiService.getFundFullData(fund);
            const endTime = performance.now();
            const duration = ((endTime - startTime) / 1000).toFixed(2);

            if (fullData) {
                updatedFundsList[i] = { 
                  ...fund, 
                  currentNAV: fullData.current.nav, 
                  lastUpdated: fullData.current.date, 
                  history: fullData.history as HistoryPoint[]
                };
                logger.success(`[${i+1}/${currentFunds.length}] ${fund.isin} procesado en ${duration}s`);
            } else {
                throw new Error(`Error al recuperar datos de ${fund.isin}. Sincronización abortada.`);
            }
        }
        
        if (onSyncComplete) onSyncComplete(updatedFundsList);
        else onFundsUpdate(updatedFundsList);
        logger.success("Sincronización finalizada correctamente.");
    } catch (error: any) {
        if (error.message?.includes("entity was not found")) {
            logger.error("Error de permisos: La clave no soporta Google Search. Selecciona una clave de pago.");
            if (window.aistudio) await window.aistudio.openSelectKey();
        } else {
            logger.error(error.message || `Error crítico en la sincronización.`);
        }
    } finally {
        setSyncStatus(null);
    }
  };

  const handleDiagnoseApi = async () => {
    setApiStatus('checking');
    logger.info("Diagnosticando conexión con Gemini v3 y Google Search...");
    
    try {
      // Forzamos la creación de una instancia limpia con la key actual
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: 'Check status of Google Search tool availability. Respond with "OK".',
        config: { 
          tools: [{ googleSearch: {} }] 
        }
      });

      if (response.text) {
        setApiStatus('active');
        logger.success("Gemini API y Google Search operativos.");
      }
    } catch (e: any) {
      setApiStatus('error');
      console.error(e);
      
      if (e.message?.includes("Requested entity was not found")) {
        logger.error("Fallo: Herramientas no disponibles para esta API Key.");
        // Sugerimos abrir el selector de key
        if (window.aistudio) {
          logger.info("Abriendo selector de API Key para resolver conflicto...");
          await window.aistudio.openSelectKey();
        }
      } else {
        logger.error("Fallo en la validación de la API Key o herramientas.");
      }
    }
  };

  const handleSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      handleDiagnoseApi(); // Re-probar tras seleccionar
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      storageService.exportToJSON(currentFunds, currentPortfolioName);
      setIsExporting(false);
      logger.success(`Copia de seguridad descargada.`);
    }, 800);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await storageService.importFromJSON(file);
      onImportData({
        funds: data.funds,
        portfolioName: data.portfolioName,
        lastSyncDate: data.lastModified
      });
      logger.success(`Cartera "${data.portfolioName}" importada con éxito.`);
    } catch (error) {
      logger.error(`Error: Archivo no compatible.`);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      
      <div className="bg-[#0d1117] border border-gray-800 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl">
        <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
           <Database size={160} className="text-neon" />
        </div>

        <div className="relative z-10 mb-10">
          <div className="flex items-center gap-4 mb-4">
             <div className="p-3 bg-neon/10 rounded-2xl border border-neon/20">
                <FileCode className="text-neon" size={24} />
             </div>
             <h2 className="text-3xl font-black text-white tracking-tight uppercase">Gestión de Datos</h2>
          </div>
          <p className="text-gray-400 text-sm font-bold max-w-2xl">
            Sincronización avanzada con IA y herramientas de respaldo patrimonial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative z-10 items-stretch">
            <div className="bg-[#161b22] p-8 rounded-[2rem] border border-gray-800 flex flex-col group hover:border-blue-500/30 transition-all">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400">
                          <CloudLightning size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-lg leading-none">Sincronización</h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">IA en vivo</p>
                        </div>
                    </div>
                    <p className="text-[13px] text-gray-400 font-medium leading-relaxed mb-10">
                      Actualización progresiva de todos los activos de la cartera mediante IA.
                    </p>
                </div>
                <button 
                  onClick={handleGlobalUpdate} 
                  disabled={!!syncStatus}
                  className="w-full bg-[#4285f4] text-white font-black py-4 rounded-2xl hover:bg-blue-600 transition-all flex justify-center items-center gap-3 text-xs tracking-wider disabled:opacity-50"
                >
                  <RefreshCw size={18} className={syncStatus ? 'animate-spin' : ''} />
                  {syncStatus ? `${syncStatus.current}/${syncStatus.total} ${syncStatus.isin}` : 'Sincronizar Todo'}
                </button>
            </div>

            <div className="bg-[#161b22] p-8 rounded-[2rem] border border-gray-800 flex flex-col group hover:border-neon/30 transition-all">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-neon/10 rounded-2xl text-neon">
                          <Download size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-lg leading-none">Backup Local</h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">JSON Formatted</p>
                        </div>
                    </div>
                    <p className="text-[13px] text-gray-400 font-medium leading-relaxed mb-10">
                      Exporta tu patrimonio actual en formato compatible JSON v1.
                    </p>
                </div>
                <button 
                  onClick={handleExport} 
                  disabled={isExporting}
                  className="w-full bg-neon text-black font-black py-4 rounded-2xl hover:bg-neon/90 transition-all flex justify-center items-center gap-3 text-xs tracking-wider"
                >
                  <Database size={18} />
                  {isExporting ? 'GENERANDO...' : 'Descargar Copia'}
                </button>
            </div>

            <div className="bg-[#161b22] p-8 rounded-[2rem] border border-gray-800 flex flex-col group hover:border-violet/30 transition-all">
                 <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-violet/10 rounded-2xl text-violet">
                          <Upload size={24} />
                        </div>
                        <div>
                          <h4 className="text-white font-black text-lg leading-none">Cargar Cartera</h4>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Restaurar datos</p>
                        </div>
                    </div>
                    <p className="text-[13px] text-gray-400 font-medium leading-relaxed mb-10">
                      Sobrescribe la sesión actual con un archivo de respaldo previo.
                    </p>
                </div>
                <input type="file" accept=".json" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                <button 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full bg-violet text-white font-black py-4 rounded-2xl hover:bg-violet/90 transition-all flex justify-center items-center gap-3 text-xs tracking-wider"
                >
                  <Upload size={18} />
                  Seleccionar Archivo
                </button>
            </div>
        </div>
      </div>

      <div className="bg-[#0d1117] border border-gray-800 rounded-[2.5rem] p-10 shadow-2xl">
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-8">Estado de Servicios</h3>
        
        <div className="grid md:grid-cols-3 gap-6">
           <ServiceBox 
             icon={<Database size={20} className="text-neon" />}
             title="Almacenamiento"
             desc="Persistencia local de sesión."
             status={<span className="bg-green-500/10 text-green-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-green-500/20">Activo</span>}
           />

           <ServiceBox 
             icon={<Key size={20} className="text-neon" />}
             title="IA Processor"
             desc="Conexión con Gemini v3 y Search."
             status={
                <div className="flex flex-col gap-3 w-full">
                   <div className="flex items-center gap-2">
                     <span className={`${apiStatus === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' : apiStatus === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-surface/50 text-gray-400 border-gray-700'} px-3 py-1.5 rounded-lg text-[9px] font-black uppercase border flex items-center gap-2`}>
                        <Wifi size={10} /> {apiStatus === 'idle' ? 'Esperando' : apiStatus === 'checking' ? 'Validando...' : apiStatus === 'active' ? 'Operativo' : 'Error / Sin Key'}
                     </span>
                     <button 
                      onClick={handleDiagnoseApi}
                      disabled={apiStatus === 'checking'}
                      className="text-gray-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 group shrink-0"
                     >
                        <Zap size={10} className="group-hover:text-yellow-400" /> TEST
                     </button>
                   </div>
                   
                   <button 
                    onClick={handleSelectKey}
                    className="flex items-center justify-center gap-2 bg-[#1a1f26] border border-gray-700 hover:border-neon/50 text-gray-300 hover:text-white text-[10px] font-black uppercase py-2 rounded-xl transition-all"
                   >
                     <Key size={12} className="text-neon" /> Configurar API Key (Pago)
                   </button>
                   
                   <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[9px] text-gray-500 hover:text-neon transition-colors font-bold uppercase tracking-widest"
                   >
                     Info Facturación <ExternalLink size={10} />
                   </a>
                </div>
             }
           />

           <ServiceBox 
             icon={<Clock size={20} className="text-violet" />}
             title="Última Sincro"
             desc="Finalización del último lote."
             status={<span className="text-gray-400 font-mono text-[11px] font-bold">{formattedSyncDate}</span>}
           />
        </div>
      </div>
    </div>
  );
};

const ServiceBox = ({ icon, title, desc, status }: any) => (
  <div className="bg-[#161b22] border border-gray-800 p-8 rounded-[1.5rem] flex flex-col justify-between min-h-[170px]">
    <div>
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h4 className="text-[13px] font-black text-white uppercase tracking-tight">{title}</h4>
      </div>
      <p className="text-[11px] font-medium text-gray-500 mb-5 leading-tight">{desc}</p>
    </div>
    <div className="flex items-center mt-auto w-full">{status}</div>
  </div>
);
