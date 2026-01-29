import { Fund, AppData } from '../types.ts';

const KEY = 'misfondos_v2_storage';

export const storageService = {
  load(): AppData {
    try {
      const stored = localStorage.getItem(KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("Error cargando LocalStorage", e);
    }
    return { 
      version: 1,
      portfolioName: 'Mi Cartera Principal', 
      lastModified: new Date().toISOString(),
      funds: []
    };
  },

  save(funds: Fund[], portfolioName: string) {
    const data: AppData = {
      version: 1,
      portfolioName,
      lastModified: new Date().toISOString(),
      funds
    };
    localStorage.setItem(KEY, JSON.stringify(data));
  },

  exportToJSON(funds: Fund[], portfolioName: string) {
    const dateStr = new Date().toISOString().split('T')[0];
    const data: AppData = {
      version: 1,
      portfolioName,
      lastModified: new Date().toISOString(),
      funds
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    // Solo Nombre_Fecha.json
    link.download = `${portfolioName.replace(/\s+/g, '_')}_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  },

  async importFromJSON(file: File): Promise<AppData> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          if (data && Array.isArray(data.funds)) {
            resolve(data as AppData);
          } else {
            reject(new Error("Formato de archivo no válido"));
          }
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Error leyendo el archivo"));
      reader.readAsText(file);
    });
  }
};