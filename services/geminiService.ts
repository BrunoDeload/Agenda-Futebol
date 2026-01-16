import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_v3_cache';
const CACHE_TIME = 12 * 60 * 60 * 1000; // Aumentado para 12 horas para evitar 429

export const fetchFootballMatches = async (forceRefresh = false): Promise<MatchDataResponse & { dataSource: 'api' | 'cache' }> => {
  // Tentar cache primeiro se não for forceRefresh
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
  if (!apiKey || apiKey === "undefined" || apiKey === "") {
    throw new Error("API_KEY não configurada no Netlify. Vá em Site Settings > Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Aja como um especialista em futebol. Liste os próximos 10 jogos de futebol (data, hora, local, campeonato) do Brasileirão (Séries A e B), Paulistão, Libertadores, Copa do Brasil e jogos da Seleção Brasileira. Priorize Corinthians, Palmeiras, São Paulo, Santos e RB Bragantino. Retorne APENAS um JSON com o campo 'matches' contendo objetos com: id (string), homeTeam, awayTeam, league, dateTime (string formato ISO 8601), status (sempre 'SCHEDULED'), venue.",
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
        throw new Error("IA retornou formato inválido. Tente atualizar.");
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
    console.error("Erro na API Gemini:", error);
    
    // Se der erro (ex: 429), tenta recuperar QUALQUER coisa do cache, mesmo antigo
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, dataSource: 'cache' };
    }
    
    throw error;
  }
};