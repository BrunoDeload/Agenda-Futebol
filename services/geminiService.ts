import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_cache_v2';
const CACHE_TIME = 120 * 60 * 1000; // 2 horas de cache para proteger a cota

// Dados de demonstração caso a API esteja bloqueada por limite de cota
const OFFLINE_DATA: MatchDataResponse = {
  matches: [
    {
      id: "offline-1",
      homeTeam: "Palmeiras",
      awayTeam: "Corinthians",
      league: "Campeonato Paulista",
      dateTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: "SCHEDULED",
      venue: "Allianz Parque"
    },
    {
      id: "offline-2",
      homeTeam: "São Paulo",
      awayTeam: "Santos",
      league: "Série A",
      dateTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: "SCHEDULED",
      venue: "MorumBIS"
    },
    {
      id: "offline-3",
      homeTeam: "Brasil",
      awayTeam: "Argentina",
      league: "Eliminatórias",
      dateTime: new Date(Date.now() + 86400000 * 10).toISOString(),
      status: "SCHEDULED",
      venue: "Maracanã"
    }
  ],
  sources: [
    { title: "Dados de Contingência (Modo Offline)", uri: "#" }
  ]
};

export const fetchFootballMatches = async (forceRefresh = false): Promise<MatchDataResponse & { dataSource: 'api' | 'cache' | 'offline' }> => {
  // 1. Verificar Cache primeiro (se não for atualização forçada)
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
    return { ...OFFLINE_DATA, dataSource: 'offline' };
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Encontre os próximos jogos (próximos 60 dias) de: Corinthians, Palmeiras, São Paulo, Santos, RB Bragantino e Seleção Brasileira.
    Retorne APENAS o JSON no formato:
    {
      "matches": [
        {
          "id": "slug",
          "homeTeam": "Time",
          "awayTeam": "Time",
          "league": "Competição",
          "dateTime": "ISOString",
          "status": "SCHEDULED",
          "venue": "Estádio"
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
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    
    let matches: Match[] = [];
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      matches = parsed.matches || [];
    }

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    const result = { matches, sources };
    
    // Salvar sucesso no cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: result,
      timestamp: Date.now()
    }));

    return { ...result, dataSource: 'api' };

  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    
    // Se falhar (especialmente erro 429), tenta o cache mesmo que antigo
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, dataSource: 'cache' };
    }

    // Se nem cache tiver, retorna dados offline para não quebrar a UI
    return { ...OFFLINE_DATA, dataSource: 'offline' };
  }
};