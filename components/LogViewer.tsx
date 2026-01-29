
import React, { useEffect, useState, useRef } from 'react';
/* Added missing Wifi icon to the imports */
import { Terminal, X, Trash2, CheckCircle, AlertTriangle, Info, AlertCircle, Wifi } from 'lucide-react';
import { logger, LogMessage } from '../services/loggerService.ts';

interface LogViewerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ isOpen, onClose }) => {
    const [logs, setLogs] = useState<LogMessage[]>(logger.getHistory());
    const scrollRef = useRef<HTMLDivElement>(null);

    // Suscribirse al servicio de logs
    useEffect(() => {
        setLogs(logger.getHistory()); // Carga inicial

        const unsubscribe = logger.subscribe((newLog) => {
            setLogs(prev => [newLog, ...prev]);
        });

        return () => unsubscribe();
    }, []);

    // Renderizar iconos según nivel
    const getIcon = (level: string) => {
        switch (level) {
            case 'success': return <CheckCircle size={14} className="text-neon" />;
            case 'warn': return <AlertTriangle size={14} className="text-orange-400" />;
            case 'error': return <AlertCircle size={14} className="text-red-500" />;
            default: return <Info size={14} className="text-blue-400" />;
        }
    };

    if (!isOpen) return null;

    return (
        /* Cambiado inset-0 por top-0 right-0 bottom-0 left-64 para respetar el sidebar */
        <div className="fixed top-0 right-0 bottom-0 left-64 z-[100] flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="w-full max-w-4xl bg-[#0d1117] border border-gray-700 rounded-2xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col h-[650px] max-h-[85vh] animate-slide-up">
                
                {/* Header Terminal */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <Terminal size={18} className="text-neon" />
                        <span className="text-xs font-mono font-black text-gray-200 uppercase tracking-widest">System Engine Terminal Output</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => { logger.clear(); setLogs([]); }}
                            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-gray-500 hover:text-red-400 transition-colors rounded-lg hover:bg-white/5 uppercase tracking-tighter"
                            title="Limpiar consola"
                        >
                            <Trash2 size={14} /> Clear
                        </button>
                        <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>
                        <button 
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Log Area */}
                <div className="flex-1 overflow-y-auto p-6 font-mono text-[11px] space-y-3 custom-scrollbar bg-black/40" ref={scrollRef}>
                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 italic">
                           <Terminal size={32} className="mb-4 opacity-10" />
                           <p>Listening for system events...</p>
                        </div>
                    )}
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 animate-slide-up group">
                            <span className="text-gray-600 whitespace-nowrap font-bold opacity-50">{log.timestamp}</span>
                            <div className="mt-0.5 shrink-0">{getIcon(log.level)}</div>
                            <span className={`break-all leading-relaxed font-medium ${
                                log.level === 'error' ? 'text-red-400' : 
                                log.level === 'success' ? 'text-neon shadow-neon' : 
                                log.level === 'warn' ? 'text-orange-300' : 'text-gray-300'
                            }`}>
                                <span className="text-[9px] font-black opacity-30 mr-2 uppercase">[{log.level}]</span>
                                {log.message}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-3 bg-gray-900 border-t border-gray-800 text-[9px] text-gray-500 flex justify-between font-mono font-bold uppercase tracking-widest">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-neon"><CheckCircle size={10} /> Gemini AI Core</span>
                        <span className="opacity-30">|</span>
                        <span className="flex items-center gap-1.5"><Wifi size={10} /> API Connected</span>
                    </div>
                    <span>Secure Kernel v1.2.8</span>
                </div>
            </div>
        </div>
    );
};
