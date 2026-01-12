import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, AlertCircle, ExternalLink, RefreshCw, Loader2, Info, Database, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'api' | 'cache' | 'offline'>('api');

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFootballMatches(force);
      setMatches(result.matches || []);
      setSources(result.sources || []);
      setSourceType(result.dataSource);
      
      if (result.dataSource === 'offline' && force) {
        setError("Não foi possível conectar à API do Google (Cota Excedida). Exibindo dados de demonstração.");
      }
    } catch (err: any) {
      setError("Erro crítico ao carregar dados.");
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
      
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-600/20">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">DALE JOGOS</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Bruno & Leandro</span>
                {sourceType === 'cache' && (
                  <span className="flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                    <Database className="w-2 h-2" /> Cache Ativo
                  </span>
                )}
                {sourceType === 'offline' && (
                  <span className="flex items-center gap-1 text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase font-black">
                    <WifiOff className="w-2 h-2" /> Modo Offline
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => loadData(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-full transition-all font-black text-[10px] tracking-widest uppercase disabled:opacity-50 shadow-xl shadow-orange-600/20"
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {loading ? 'Sincronizando...' : 'Atualizar Agora'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-5 rounded-2xl flex items-start gap-4 mb-8 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-widest">Aviso de Conexão</p>
              <p className="text-xs opacity-90 mt-1 font-medium">{error}</p>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-10">
          <div className="w-1.5 h-8 bg-green-500 rounded-full shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Agenda de Partidas</h2>
        </div>

        {loading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-slate-900/40 rounded-3xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : sortedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 border-2 border-dashed border-white/5 rounded-[40px] bg-slate-950/40">
            <Info className="w-10 h-10 text-slate-700 mx-auto mb-4" />
            <p className="text-slate-500 font-black uppercase text-xs tracking-[0.2em]">Nenhuma partida encontrada</p>
          </div>
        )}

        {sources.length > 0 && sourceType !== 'offline' && (
          <div className="mt-20 pt-10 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] mb-6 text-center md:text-left">Fontes em Tempo Real</p>
            <div className="flex flex-wrap gap-3">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-900/80 border border-white/5 px-4 py-2.5 rounded-xl text-slate-400 hover:text-orange-500 hover:border-orange-500/30 transition-all flex items-center gap-2 font-bold shadow-lg">
                  <ExternalLink className="w-3 h-3" /> {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {sourceType === 'offline' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Modo de Segurança Ativado</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;