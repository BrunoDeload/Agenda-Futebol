import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, RefreshCw, Loader2, Info, Database, Zap, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'api' | 'cache'>('api');

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFootballMatches(force);
      setMatches(result.matches || []);
      setSources(result.sources || []);
      setSourceType(result.dataSource);
    } catch (err: any) {
      console.error("Erro capturado no App:", err);
      // Exibir a mensagem real do erro para ajudar no debug
      const errorMsg = err.message || "Erro desconhecido";
      if (errorMsg.includes("429")) {
        setError("Limite de requisições excedido. Tente novamente em alguns minutos.");
      } else if (errorMsg.includes("API_KEY") || errorMsg.includes("Chave")) {
        setError("Chave de API não encontrada ou inválida. Verifique as variáveis de ambiente.");
      } else {
        setError(`Erro na API: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }, [matches]);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="fixed inset-0 z-[-2] bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)] opacity-40" />
      
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 p-2 rounded-lg shadow-lg">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">DALE JOGOS</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Bruno & Leandro</span>
                {!loading && !error && (
                  <>
                    {sourceType === 'api' ? (
                      <span className="flex items-center gap-1 text-[8px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 uppercase font-black">
                        <Zap className="w-2 h-2 fill-current" /> Live
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                        <Database className="w-2 h-2" /> Cache
                      </span>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 border border-white/10 hover:border-orange-500/50 text-white px-5 py-2 rounded-full transition-all font-bold text-[10px] tracking-widest uppercase disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {loading ? 'Sincronizando...' : 'Atualizar'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-red-400 font-black uppercase tracking-wider">Falha na Sincronização</p>
              <p className="text-xs text-red-500/80 mt-0.5">{error}</p>
            </div>
            <button 
              onClick={() => loadData(true)}
              className="ml-auto text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-500 px-3 py-1 rounded-md font-bold uppercase"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Agenda de Partidas</h2>
        </div>

        {loading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-dashed border-white/5">
            <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-bold uppercase text-xs">Nenhum jogo encontrado no momento.</p>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Fontes de Dados (Grounding)</p>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[9px] bg-slate-900 px-3 py-1.5 rounded-lg text-slate-500 hover:text-orange-500 transition-colors border border-white/5">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;