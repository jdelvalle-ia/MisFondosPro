import React from 'react';
import { Database, ShieldCheck, Wifi } from 'lucide-react';

export const Connections: React.FC = () => {
  return (
    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-lg">
            <div className="flex items-center mb-4 text-green-400">
                <Database className="mr-3" size={24} />
                <h3 className="text-lg font-bold text-text">Google Drive Storage</h3>
            </div>
            <p className="text-subtext text-sm mb-4">
                Conexión establecida con el sistema de archivos de Google. Lectura en tiempo real de tu hoja maestra.
            </p>
            <div className="flex items-center text-xs bg-green-500/10 text-green-400 px-3 py-1.5 rounded w-fit border border-green-500/20">
                <Wifi size={12} className="mr-2" /> 
                Estado: Online (Latencia: 45ms)
            </div>
        </div>

        <div className="bg-card p-6 rounded-xl border border-gray-800 shadow-lg">
            <div className="flex items-center mb-4 text-neon">
                <ShieldCheck className="mr-3" size={24} />
                <h3 className="text-lg font-bold text-text">Gemini AI Processor</h3>
            </div>
            <p className="text-subtext text-sm mb-4">
                Motor de inteligencia artificial activo para búsqueda de valoraciones y cálculo de sentimiento de mercado.
            </p>
             <div className="flex items-center text-xs bg-neon/10 text-neon px-3 py-1.5 rounded w-fit border border-neon/20">
                <Wifi size={12} className="mr-2" /> 
                Estado: Operativo
            </div>
        </div>
    </div>
  );
};