
import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

export const fetchFootballMatches = async (): Promise<MatchDataResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY não configurada. Adicione a variável de ambiente no Netlify.");
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
    - O campo 'dateTime' deve estar no formato ISO 8601 UTC.
    
    RETORNE APENAS JSON:
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
        console.error("Erro ao processar JSON do Gemini:", e);
      }
    }

    return {
      matches: parsedMatches,
      sources: sources
    };
  } catch (error) {
    console.error("Erro na busca de jogos via Gemini:", error);
    throw error;
  }
};
