import { Fund } from '../types.ts';

export const sheetService = {
  /**
   * Intenta obtener los datos de la hoja de cálculo configurada.
   * Utiliza el endpoint de visualización (gviz) para exportar a CSV, que suele tener mejores políticas CORS para hojas públicas.
   */
  async fetchFunds(sheetId: string): Promise<Fund[]> {
    try {
      // Endpoint para exportación CSV de Google Sheets
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error al conectar con Google Sheets: ${response.statusText}`);
      }

      const csvText = await response.text();
      return this.parseCSV(csvText);
    } catch (error) {
      console.error("Falló la carga de datos:", error);
      throw error;
    }
  },

  /**
   * Parsea el texto CSV a objetos Fund.
   * Asume el orden de columnas definido en la plantilla:
   * 0: ISIN, 1: Name, 2: Manager, 3: Category, 4: BuyDate, 5: Invested, 
   * 6: Currency, 7: Shares, 8: Fees, 9: NAV, 10: LastUpdated
   */
  parseCSV(csvText: string): Fund[] {
    const lines = csvText.split('\n');
    const funds: Fund[] = [];

    // Función robusta para parsear números considerando formatos ES (1.000,00) vs US (1,000.00)
    const parseNum = (val: string) => {
      if (!val) return 0;
      
      // Limpiamos espacios y caracteres de moneda si los hubiera (ej: "1.200,50 €")
      let cleanVal = val.replace(/[^\d.,-]/g, '').trim();
      
      if (!cleanVal) return 0;

      // Heurística: Determinamos el formato basándonos en la posición de los separadores
      const lastCommaIndex = cleanVal.lastIndexOf(',');
      const lastDotIndex = cleanVal.lastIndexOf('.');

      if (lastCommaIndex > lastDotIndex) {
        // Formato ESPAÑOL/EUROPEO (ej: 1.234,56 o 1234,56)
        // 1. Eliminamos los puntos (separadores de miles)
        cleanVal = cleanVal.replace(/\./g, '');
        // 2. Reemplazamos la coma por punto (para que JS lo entienda como decimal)
        cleanVal = cleanVal.replace(',', '.');
      } else {
         // Formato INGLÉS/US (ej: 1,234.56)
         // 1. Eliminamos las comas (separadores de miles)
         cleanVal = cleanVal.replace(/,/g, '');
         // El punto decimal se mantiene igual
      }

      const num = parseFloat(cleanVal);
      return isNaN(num) ? 0 : num;
    };

    const clean = (val: string) => val ? val.replace(/^"|"$/g, '').trim() : '';

    // Saltamos la cabecera (índice 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Regex para dividir por comas respetando las comillas dobles
      const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); 

      if (cols.length < 10) continue;

      funds.push({
        isin: clean(cols[0]),
        name: clean(cols[1]),
        manager: clean(cols[2]),
        category: clean(cols[3]),
        buyDate: clean(cols[4]),
        investedAmount: parseNum(cols[5]),
        currency: clean(cols[6]),
        shares: parseNum(cols[7]),
        fees: parseNum(cols[8]),
        currentNAV: parseNum(cols[9]),
        lastUpdated: clean(cols[10])
      });
    }

    return funds;
  }
};