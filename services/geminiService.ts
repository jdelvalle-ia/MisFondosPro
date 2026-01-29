import { GoogleGenAI, Type } from "@google/genai";
import { Fund } from '../types.ts';
import { logger } from './loggerService.ts';

const cleanAndParseJSON = (text: string | undefined) => {
  if (!text) return null;
  try {
    const cleanText = text.replace(/```json\n?|```/g, '').trim();
    return JSON.parse(cleanText);
  } catch (e) {
    logger.error("Error al parsear JSON de la IA");
    return null;
  }
};

export const geminiService = {
  async getFundFullData(fund: Fund): Promise<{ current: { nav: number; date: string }, history: { date: string; nav: number }[] } | null> {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const today = new Date().toISOString().split('T')[0];
      const prompt = `INSTRUCCIÓN DE ALTA PRECISIÓN FINANCIERA: 
      Necesito el Valor Liquidativo (NAV) MÁS RECIENTE a fecha de hoy (${today}) para el fondo:
      Nombre: ${fund.name}
      ISIN: ${fund.isin}

      REQUISITOS OBLIGATORIOS:
      1. PRIORIDAD TEMPORAL: Busca la última valoración de cierre oficial. Si hay datos de hoy o ayer, úsalos. No aceptes datos de más de 72h de antigüedad si el mercado ha estado abierto.
      2. CONSISTENCIA ISIN: El dato debe pertenecer exclusivamente a la clase del ISIN ${fund.isin}.
      3. HISTORIAL: Genera una serie de los últimos 24 meses (1 punto por mes).

      RESPUESTA EXCLUSIVA EN JSON:
      {
        "current": { "nav": number, "date": "YYYY-MM-DD" },
        "history": [ { "date": "YYYY-MM-DD", "nav": number }, ... ]
      }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Eres un analista de datos financieros experto en Bloomberg y Morningstar. Tu prioridad es la exactitud del último Valor Liquidativo disponible.",
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              current: {
                type: Type.OBJECT,
                properties: {
                  nav: { type: Type.NUMBER },
                  date: { type: Type.STRING }
                },
                required: ["nav", "date"]
              },
              history: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING },
                    nav: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        },
      });

      const data = cleanAndParseJSON(response.text);
      if (!data || !data.current) {
        logger.error(`No se pudieron obtener datos fiables para ${fund.isin}`);
        return null;
      }

      return data;
    } catch (error) {
      logger.error(`Error crítico en la consulta de IA para ${fund.isin}: ${error}`);
      return null;
    }
  }
};