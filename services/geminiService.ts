import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_v3_cache';
const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 horas de cache para otimização

export const fetchFootballMatches = async (forceRefresh = false): Promise<MatchDataResponse & { dataSource: 'api' | 'cache' }> => {
  // 1. Tentar Cache primeiro se não for refresh forçado
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TIME) {
          return { ...data, dataSource: 'cache' };
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    throw new Error("Chave de API não configurada.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Liste os próximos 8 jogos (data, hora, local, campeonato) de: Corinthians, Palmeiras, São Paulo, Santos, RB Bragantino e Seleção Brasileira. Retorne APENAS um JSON válido com o campo 'matches' contendo objetos com: id (string única), homeTeam, awayTeam, league, dateTime (ISO 8601), status ('SCHEDULED'), venue.",
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
      // Fallback para extração manual se o JSON vier com markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matches = JSON.parse(jsonMatch[0]).matches || [];
      } else {
        throw new Error("Formato de resposta inválido.");
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
    
    // Salva no cache apenas se houver sucesso
    localStorage.setItem(CACHE_KEY, JSON.stringify({ 
      data: result, 
      timestamp: Date.now() 
    }));

    return { ...result, dataSource: 'api' };

  } catch (error: any) {
    console.error("Erro na busca da API:", error);
    
    // Se a API falhar e tivermos um cache (mesmo antigo), usamos ele como última esperança
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, dataSource: 'cache' };
    }
    
    throw error; // Repassa o erro se não houver nenhuma forma de exibir dados
  }
};