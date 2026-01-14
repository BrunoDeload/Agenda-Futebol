import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_v3_cache';
const CACHE_TIME = 6 * 60 * 60 * 1000; // 6 horas

export const fetchFootballMatches = async (forceRefresh = false): Promise<MatchDataResponse & { dataSource: 'api' | 'cache' }> => {
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
    console.error("ERRO: API_KEY não encontrada nas variáveis de ambiente.");
    throw new Error("A chave de API não foi configurada no Netlify. Verifique as Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Liste os próximos 8 jogos importantes de futebol (data, hora, local, campeonato) focando em Corinthians, Palmeiras, São Paulo, Santos, RB Bragantino e Seleção Brasileira. Retorne um JSON com o campo 'matches' contendo: id, homeTeam, awayTeam, league, dateTime (ISO), status ('SCHEDULED'), venue.",
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
        throw new Error("Resposta da IA em formato inválido.");
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
    console.error("Detalhes do erro na API:", error);
    
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, dataSource: 'cache' };
    }
    
    throw error;
  }
};