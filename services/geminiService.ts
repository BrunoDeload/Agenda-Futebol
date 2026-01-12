import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

export const fetchFootballMatches = async (): Promise<MatchDataResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey || apiKey === "undefined") {
    throw new Error("API_KEY não encontrada. Verifique as 'Environment Variables' no painel do Netlify.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Encontre os próximos jogos de futebol (próximos 90 dias) dos seguintes times paulistas: 
    Corinthians, Palmeiras, São Paulo, Santos, Red Bull Bragantino, Guarani, Ponte Preta, Mirassol, Novorizontino, Ituano e Botafogo-SP.
    Inclua também jogos da Seleção Brasileira Masculina Principal.
    
    Considere competições oficiais: Brasileirão (Série A e B), Copa do Brasil, Libertadores, Sul-Americana e Eliminatórias da Copa.
    
    Retorne os dados EXATAMENTE neste formato JSON:
    {
      "matches": [
        {
          "id": "slug-unico",
          "homeTeam": "Nome do Time",
          "awayTeam": "Nome do Time",
          "league": "Nome da Competição",
          "dateTime": "YYYY-MM-DDTHH:mm:ssZ",
          "status": "SCHEDULED",
          "venue": "Nome do Estádio"
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
    let matches: Match[] = [];
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        matches = (parsed.matches || []).map((m: any) => ({
          ...m,
          id: m.id || Math.random().toString(36).substr(2, 9),
          status: m.status || 'SCHEDULED'
        }));
      } catch (e) {
        console.error("Erro no JSON:", e);
      }
    }

    return { matches, sources };
  } catch (error: any) {
    if (error.message?.includes("429")) {
      throw new Error("LIMITE DA API ATINGIDO (Erro 429). A chave configurada no Netlify excedeu a cota gratuita do Google AI Studio.");
    }
    throw error;
  }
};