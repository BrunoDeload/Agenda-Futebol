import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_v3_cache';
const CACHE_TIME = 12 * 60 * 60 * 1000; // 12 horas
const MIN_REFRESH_INTERVAL = 60 * 1000; // 1 minuto de intervalo mínimo entre chamadas reais

export interface EnhancedMatchResponse extends MatchDataResponse {
  dataSource: 'api' | 'cache';
  error?: string;
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

  // Se não for forçado e o cache estiver no prazo, usa cache
  if (!forceRefresh && cachedData && (Date.now() - lastTimestamp < CACHE_TIME)) {
    return { ...cachedData, dataSource: 'cache' };
  }

  // Se forçado, mas a última chamada foi há menos de 1 minuto, evita spam
  if (forceRefresh && (Date.now() - lastTimestamp < MIN_REFRESH_INTERVAL) && cachedData) {
    return { ...cachedData, dataSource: 'cache', error: "Aguarde um pouco antes de atualizar novamente." };
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    if (cachedData) return { ...cachedData, dataSource: 'cache', error: "API_KEY não configurada. Exibindo dados salvos." };
    throw new Error("API_KEY não encontrada. Configure as variáveis de ambiente no Netlify.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Aja como um especialista em futebol brasileiro. Liste os próximos 12 jogos de futebol (data, hora, local, campeonato) do Brasileirão (Séries A e B), Paulistão, Libertadores, Copa do Brasil e jogos da Seleção Brasileira. Priorize Corinthians, Palmeiras, São Paulo, Santos e RB Bragantino. Retorne APENAS um JSON com o campo 'matches' contendo objetos com: id (string), homeTeam, awayTeam, league, dateTime (string formato ISO 8601), status (sempre 'SCHEDULED'), venue.",
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
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]).matches || [];
      } else {
        throw new Error("Resposta da IA em formato inesperado.");
      }
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    const result = { matches, sources };
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data: result, timestamp: Date.now() }));

    return { ...result, dataSource: 'api' };

  } catch (error: any) {
    console.warn("Falha na API Gemini:", error);
    
    // Se houver erro (429, etc), retorna o cache se ele existir
    if (cachedData) {
      const isRateLimit = error.message?.includes("429") || JSON.stringify(error).includes("429");
      return { 
        ...cachedData, 
        dataSource: 'cache', 
        error: isRateLimit 
          ? "Limite do Google excedido. Exibindo dados do cache enquanto aguardamos a liberação." 
          : "Erro na conexão. Exibindo dados salvos." 
      };
    }
    
    throw error;
  }
};