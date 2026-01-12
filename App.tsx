import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, RefreshCw, Loader2, Info, Database, WifiOff, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [sourceType, setSourceType] = useState<'api' | 'cache' | 'offline'>('api');

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const result = await fetchFootballMatches(force);
      setMatches(result.matches || []);
      setSources(result.sources || []);
      setSourceType(result.dataSource);
    } catch (err: any) {
      setSourceType('offline');
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
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Dash por Bruno & Leandro</span>
                {sourceType === 'api' && (
                  <span className="flex items-center gap-1 text-[8px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20 uppercase font-black">
                    <Zap className="w-2 h-2" /> Live
                  </span>
                )}
                {sourceType === 'cache' && (
                  <span className="flex items-center gap-1 text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 uppercase font-black">
                    <Database className="w-2 h-2" /> Local
                  </span>
                )}
                {sourceType === 'offline' && (
                  <span className="flex items-center gap-1 text-[8px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 uppercase font-black">
                    <WifiOff className="w-2 h-2" /> Demo
                  </span>
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
        {sourceType === 'offline' && (
          <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl flex items-center gap-3 mb-8">
            <Info className="w-4 h-4 text-amber-500" />
            <p className="text-[10px] text-amber-500/80 font-bold uppercase tracking-wider">
              Cota da API excedida. Exibindo dados de pré-visualização. Tente atualizar em alguns minutos.
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-1 h-6 bg-orange-500 rounded-full"></div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Próximos Confrontos</h2>
        </div>

        {loading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-900/40 rounded-2xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {sources.length > 0 && sourceType !== 'offline' && (
          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mb-4">Referências</p>
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