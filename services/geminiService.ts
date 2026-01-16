import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_premium_v5';
const CACHE_TIME = 8 * 60 * 60 * 1000; // 8 horas de validade

// Dados de demonstração caso o primeiro acesso sofra 429
const STATIC_FALLBACK: Match[] = [
  {
    id: 'demo-1',
    homeTeam: 'Corinthians',
    awayTeam: 'Palmeiras',
    league: 'Brasileirão',
    dateTime: new Date(Date.now() + 86400000).toISOString(),
    status: 'SCHEDULED',
    prediction: 'Derby tenso com favoritismo equilibrado.',
    venue: 'Neo Química Arena'
  },
  {
    id: 'demo-2',
    homeTeam: 'São Paulo',
    awayTeam: 'Santos',
    league: 'Paulistão',
    dateTime: new Date(Date.now() + 172800000).toISOString(),
    status: 'SCHEDULED',
    prediction: 'San-São decisivo para a classificação.',
    venue: 'MorumBIS'
  }
];

export interface EnhancedMatchResponse extends MatchDataResponse {
  dataSource: 'api' | 'cache' | 'fallback';
  error?: string;
  isRateLimited?: boolean;
  lastUpdated?: number;
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

  // Lógica de cache inteligente
  if (!forceRefresh && cachedData && (Date.now() - lastTimestamp < CACHE_TIME)) {
    return { ...cachedData, dataSource: 'cache', lastUpdated: lastTimestamp };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    if (cachedData) return { ...cachedData, dataSource: 'cache', error: "API_KEY não configurada.", lastUpdated: lastTimestamp };
    return { matches: STATIC_FALLBACK, sources: [], dataSource: 'fallback', error: "Configure a API_KEY no Netlify." };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Aja como um analista de dados esportivos experiente. Liste os próximos 20 jogos mais importantes de futebol (data, hora, local, campeonato) do Brasileirão, Paulistão, Libertadores e Copa do Brasil. Priorize os grandes de SP (Corinthians, Palmeiras, São Paulo, Santos). Retorne APENAS um JSON puro com o campo 'matches' contendo: id (string uuid), homeTeam, awayTeam, league, dateTime (ISO 8601), status (SCHEDULED ou LIVE), venue. Adicione uma 'prediction' de 1 frase para cada.",
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
    const now = Date.now();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: now }));

    return { ...result, dataSource: 'api', lastUpdated: now };

  } catch (error: any) {
    const errorStr = JSON.stringify(error);
    const isRateLimit = errorStr.includes("429") || errorStr.includes("RESOURCE_EXHAUSTED");
    
    if (cachedData) {
      return { 
        ...cachedData, 
        dataSource: 'cache', 
        isRateLimited: isRateLimit,
        lastUpdated: lastTimestamp,
        error: isRateLimit ? "Cota excedida. Exibindo última atualização salva." : "Erro de conexão."
      };
    }
    
    // Se não tem cache, usa o fallback estático para não quebrar a UI
    return { 
      matches: STATIC_FALLBACK, 
      sources: [], 
      dataSource: 'fallback', 
      isRateLimited: isRateLimit,
      error: "O Google limitou as requisições e não temos dados salvos. Exibindo partidas de exemplo." 
    };
  }
};