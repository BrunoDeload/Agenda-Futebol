import { GoogleGenAI } from "@google/genai";
import { Match, MatchDataResponse, GroundingSource } from "../types";

export const fetchFootballMatches = async (): Promise<MatchDataResponse> => {
  // Tenta pegar a chave do ambiente injetado pelo Vite
  const apiKey = process.env.API_KEY;
  
  // Verifica se a chave é válida (não nula, não undefined e não a string "undefined")
  if (!apiKey || apiKey === "undefined" || apiKey.length < 10) {
    console.error("Erro Crítico: API_KEY não detectada no ambiente.");
    throw new Error("API_KEY ausente. Vá ao painel do Netlify > Site Settings > Environment Variables e adicione a chave 'API_KEY'.");
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
    
    // Extração de fontes de fundamentação (Grounding)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources: GroundingSource[] = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title,
        uri: chunk.web.uri
      }));

    // Limpeza da resposta para garantir que pegamos apenas o bloco JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    let matches: Match[] = [];
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        matches = (parsed.matches || []).map((m: any) => ({
          ...m,
          status: m.status || 'SCHEDULED'
        }));
      } catch (e) {
        console.error("Erro ao processar JSON da IA:", e);
      }
    }

    return { matches, sources };
  } catch (error: any) {
    console.error("Erro na chamada Gemini:", error);
    throw error;
  }
};