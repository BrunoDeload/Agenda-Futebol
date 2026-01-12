
import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchFootballMatches = async (): Promise<MatchDataResponse> => {
  const prompt = `
    Encontre os próximos jogos de futebol envolvendo:
    1. EXCLUSIVAMENTE os principais times PAULISTAS das Séries A e B (Corinthians, Palmeiras, São Paulo, Santos, Red Bull Bragantino, Ituano, Guarani, Ponte Preta, Novorizontino, Mirassol, Botafogo-SP).
    2. A SELEÇÃO BRASILEIRA (Principal masculina).
    
    Considere competições como Brasileirão (Série A e B), Copa do Brasil, Libertadores, Sul-Americana, Eliminatórias da Copa e Amistosos.
    
    IMPORTANTE: 
    - Busque jogos AGENDADOS para os próximos 3 MESES (90 dias).
    - Remova e ignore completamente qualquer partida do Campeonato Paulista SÉRIE A2.
    - NÃO inclua placares, apenas a data, hora, times e local.
    
    Retorne uma lista estruturada de jogos em formato JSON.
    
    Responda apenas com o JSON:
    {
      "matches": [
        {
          "id": "string única",
          "homeTeam": "nome oficial do time",
          "awayTeam": "nome oficial do time",
          "league": "nome da competição",
          "dateTime": "ISO format date string",
          "status": "SCHEDULED",
          "venue": "nome do estádio"
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

    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/{[\s\S]*}/);
    let parsedMatches: Match[] = [];
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        parsedMatches = parsed.matches || [];
      } catch (e) {
        console.error("Failed to parse JSON from Gemini response", e);
      }
    }

    return {
      matches: parsedMatches,
      sources: sources
    };
  } catch (error) {
    console.error("Error fetching matches:", error);
    throw error;
  }
};
