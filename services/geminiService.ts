import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

export const fetchFootballMatches = async (): Promise<MatchDataResponse> => {
  // O Vite injeta process.env.API_KEY conforme definido no vite.config.ts
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY não encontrada. Certifique-se de configurar a variável de ambiente API_KEY no painel da Netlify.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Aja como um especialista em futebol brasileiro.
    Encontre os próximos jogos de futebol envolvendo:
    1. EXCLUSIVAMENTE os principais times PAULISTAS: Corinthians, Palmeiras, São Paulo, Santos, Red Bull Bragantino, Ituano, Guarani, Ponte Preta, Novorizontino, Mirassol, Botafogo-SP.
    2. A SELEÇÃO BRASILEIRA (Principal masculina).
    
    Considere competições como Brasileirão (Série A e B), Copa do Brasil, Libertadores, Sul-Americana e Eliminatórias.
    
    REGRAS: 
    - Busque jogos agendados para os próximos 90 dias.
    - Ignore Paulistão A2.
    - O campo 'dateTime' deve estar no formato ISO 8601 UTC (ex: 2024-05-20T20:00:00Z).
    
    RETORNE APENAS JSON PURO:
    {
      "matches": [
        {
          "id": "string",
          "homeTeam": "string",
          "awayTeam": "string",
          "league": "string",
          "dateTime": "ISO_DATE_STRING",
          "status": "SCHEDULED",
          "venue": "string"
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
    let parsedMatches: Match[] = [];
    
    if (jsonMatch) {
      try {
        const cleanedJson = jsonMatch[0].trim();
        const parsed = JSON.parse(cleanedJson);
        parsedMatches = (parsed.matches || []).map((m: any) => ({
          ...m,
          id: m.id || Math.random().toString(36).substr(2, 9),
          status: 'SCHEDULED'
        }));
      } catch (e) {
        console.error("Erro ao converter JSON do Gemini:", e);
      }
    }

    return {
      matches: parsedMatches,
      sources: sources
    };
  } catch (error: any) {
    console.error("Erro na API Gemini:", error);
    if (error.message?.includes("API_KEY")) throw error;
    throw new Error("Falha ao buscar jogos. Verifique sua conexão ou a cota da API.");
  }
};