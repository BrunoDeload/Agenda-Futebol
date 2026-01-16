import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_premium_v4';
const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 horas

export interface EnhancedMatchResponse extends MatchDataResponse {
  dataSource: 'api' | 'cache';
  error?: string;
  isRateLimited?: boolean;
}

export const fetchFootballMatches = async (forceRefresh = false): Promise<EnhancedMatchResponse> => {
  const cached = localStorage.getItem(CACHE_KEY);
  let cachedData: any = null;
  let lastTimestamp = 0;

  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      cachedData = parsed.data;
      lastTimestamp = parsed.timestamp;
    } catch (e) {
      localStorage.removeItem(CACHE_KEY);
    }
  }

  // Se não for forçado e o cache for recente, usa ele
  if (!forceRefresh && cachedData && (Date.now() - lastTimestamp < CACHE_TIME)) {
    return { ...cachedData, dataSource: 'cache' };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    if (cachedData) return { ...cachedData, dataSource: 'cache', error: "Modo Offline (API_KEY ausente)" };
    throw new Error("API_KEY não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Aja como um analista de dados esportivos. Liste os próximos 20 jogos importantes de futebol (data, hora, local, campeonato) do Brasileirão (Séries A e B), Paulistão, Libertadores, Sulamericana, Copa do Brasil e Champions League. Priorize times de São Paulo. Retorne APENAS um JSON puro com o campo 'matches' contendo: id (string uuid), homeTeam, awayTeam, league, dateTime (ISO 8601), status (SCHEDULED ou LIVE), venue. Inclua também uma breve 'prediction' (string curta) para cada jogo.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      },
    });

    const text = response.text || "";
    let matches: Match[] = [];
    
    try {
      const parsed = JSON.parse(text);
      matches = parsed.matches || [];
    } catch (e) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) matches = JSON.parse(jsonMatch[0]).matches || [];
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({ title: chunk.web.title, uri: chunk.web.uri }));

    const result = { matches, sources };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));

    return { ...result, dataSource: 'api' };

  } catch (error: any) {
    const isRateLimit = JSON.stringify(error).includes("429");
    
    if (cachedData) {
      return { 
        ...cachedData, 
        dataSource: 'cache', 
        isRateLimited: isRateLimit,
        error: isRateLimit ? "Limite do Google atingido. Usando dados salvos." : "Falha na conexão."
      };
    }
    throw error;
  }
};