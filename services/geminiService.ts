import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const CACHE_KEY = 'dale_jogos_v3_cache';
const CACHE_TIME = 12 * 60 * 60 * 1000; // 12 horas de cache

const OFFLINE_DATA: MatchDataResponse = {
  matches: [
    {
      id: "off-1",
      homeTeam: "Corinthians",
      awayTeam: "Palmeiras",
      league: "Campeonato Paulista",
      dateTime: new Date(Date.now() + 86400000 * 1).toISOString(),
      status: "SCHEDULED",
      venue: "Neo Química Arena"
    },
    {
      id: "off-2",
      homeTeam: "São Paulo",
      awayTeam: "RB Bragantino",
      league: "Campeonato Paulista",
      dateTime: new Date(Date.now() + 86400000 * 2).toISOString(),
      status: "SCHEDULED",
      venue: "MorumBIS"
    },
    {
      id: "off-3",
      homeTeam: "Santos",
      awayTeam: "Mirassol",
      league: "Paulistão Série A2",
      dateTime: new Date(Date.now() + 86400000 * 3).toISOString(),
      status: "SCHEDULED",
      venue: "Vila Belmiro"
    },
    {
      id: "off-4",
      homeTeam: "Brasil",
      awayTeam: "Colômbia",
      league: "Eliminatórias",
      dateTime: new Date(Date.now() + 86400000 * 15).toISOString(),
      status: "SCHEDULED",
      venue: "Arena Fonte Nova"
    },
    {
      id: "off-5",
      homeTeam: "Ponte Preta",
      awayTeam: "Guarani",
      league: "Série B",
      dateTime: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: "SCHEDULED",
      venue: "Moisés Lucarelli"
    }
  ],
  sources: [
    { title: "Modo de Demonstração (Dados Locais)", uri: "#" }
  ]
};

export const fetchFootballMatches = async (forceRefresh = false): Promise<MatchDataResponse & { dataSource: 'api' | 'cache' | 'offline' }> => {
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TIME) {
        return { ...data, dataSource: 'cache' };
      }
    }
  }

  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === "undefined") {
    return { ...OFFLINE_DATA, dataSource: 'offline' };
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Liste 6 próximos jogos de Corinthians, Palmeiras, SPFC, Santos e Seleção Brasileira em 2024/2025. Retorne APENAS um JSON com array 'matches' contendo: id, homeTeam, awayTeam, league, dateTime (ISO), status, venue.",
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
      console.error("Erro ao parsear JSON da API");
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) matches = JSON.parse(jsonMatch[0]).matches || [];
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
    console.warn("API 429 ou erro de rede. Usando fallback.");
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data } = JSON.parse(cached);
      return { ...data, dataSource: 'cache' };
    }
    return { ...OFFLINE_DATA, dataSource: 'offline' };
  }
};