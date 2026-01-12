
import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

// The API key is assumed to be provided by the environment
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const fetchFootballMatches = async (): Promise<MatchDataResponse> => {
  const prompt = `
    Encontre os próximos jogos de futebol envolvendo:
    1. EXCLUSIVAMENTE os principais times PAULISTAS das Séries A e B: Corinthians, Palmeiras, São Paulo, Santos, Red Bull Bragantino, Ituano, Guarani, Ponte Preta, Novorizontino, Mirassol, Botafogo-SP.
    2. A SELEÇÃO BRASILEIRA (Principal masculina).
    
    Considere competições como Brasileirão (Série A e B), Copa do Brasil, Libertadores, Sul-Americana, Eliminatórias da Copa e Amistosos.
    
    REGRAS CRÍTICAS: 
    - Busque apenas jogos AGENDADOS para os próximos 90 dias (3 meses).
    - IGNORE COMPLETAMENTE o Campeonato Paulista SÉRIE A2.
    - NÃO inclua placares, apenas a data, hora, times e local.
    - O campo 'dateTime' DEVE estar no formato ISO 8601 (ex: 2024-05-20T20:00:00Z).
    - O campo 'status' deve ser sempre 'SCHEDULED'.
    
    RETORNE APENAS UM JSON PURO seguindo exatamente esta estrutura:
    {
      "matches": [
        {
          "id": "string-unica",
          "homeTeam": "Nome do Time",
          "awayTeam": "Nome do Time",
          "league": "Nome da Competição",
          "dateTime": "2024-MM-DDTHH:mm:00Z",
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
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    // Improved JSON extraction regex to handle potential markdown or extra text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let parsedMatches: Match[] = [];
    
    if (jsonMatch) {
      try {
        const cleanedJson = jsonMatch[0].trim();
        const parsed = JSON.parse(cleanedJson);
        parsedMatches = (parsed.matches || []).map((m: any) => ({
          ...m,
          // Ensure ID exists
          id: m.id || Math.random().toString(36).substr(2, 9),
          // Fallback status
          status: 'SCHEDULED'
        }));
      } catch (e) {
        console.error("Gemini JSON parse error:", e, "Raw text:", text);
      }
    } else {
      console.warn("No JSON found in Gemini response:", text);
    }

    return {
      matches: parsedMatches,
      sources: sources
    };
  } catch (error) {
    console.error("Fatal fetch error in geminiService:", error);
    throw error;
  }
};
