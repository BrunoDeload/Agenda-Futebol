import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_cache';
const CACHE_TIME = 30 * 60 * 1000; // 30 minutos

export const fetchFootballMatches = async (forceRefresh = false): Promise<MatchDataResponse & { fromCache?: boolean }> => {
  // 1. Verificar Cache
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        return { ...data, fromCache: true };
      }
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY não encontrada no Netlify.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Encontre os próximos jogos de futebol (próximos 90 dias) dos seguintes times paulistas: 
    Corinthians, Palmeiras, São Paulo, Santos, Red Bull Bragantino, Guarani, Ponte Preta, Mirassol, Novorizontino, Ituano e Botafogo-SP.
    Inclua também jogos da Seleção Brasileira Masculina Principal.
    Retorne apenas jogos de competições oficiais.
    
    Retorne os dados EXATAMENTE neste formato JSON:
    {
      "matches": [
        {
          "id": "slug-unico",
          "homeTeam": "Nome do Time",
          "awayTeam": "Nome do Time",
          "league": "Nome da Competição",
          "dateTime": "YYYY-MM-DDTHH:mm:ssZ",
          "status": "SCHEDULED",
          "venue": "Nome do Estádio"
        }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let matches: Match[] = [];
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        matches = (parsed.matches || []).map((m: any) => ({
          ...m,
          id: m.id || Math.random().toString(36).substr(2, 9),
          status: m.status || 'SCHEDULED'
        }));
      } catch (e) {
        console.error("Erro no JSON:", e);
      }
    }

    const result = { matches, sources };
    
    // 2. Salvar no Cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));

    return { ...result, fromCache: false };
  } catch (error: any) {
    if (error.message?.includes("429")) {
      // Se der erro 429 mas tivermos cache (mesmo que antigo), vamos retornar o antigo em vez do erro
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data } = JSON.parse(cached);
        return { ...data, fromCache: true };
      }
      throw new Error("LIMITE DA API EXCEDIDO. Tente novamente em 2 minutos.");
    }
    throw error;
  }
};