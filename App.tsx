import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, AlertCircle, ExternalLink, RefreshCw, Loader2, Info, Database } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);

  const loadData = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFootballMatches(force);
      setMatches(data.matches || []);
      setSources(data.sources || []);
      setIsCached(!!data.fromCache);
    } catch (err: any) {
      setError(err.message || "Erro inesperado.");
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
      <div 
        className="fixed inset-0 z-[-2] pointer-events-none opacity-40"
        style={{
          backgroundImage: `radial-gradient(circle at 50% 50%, #1e293b 0%, #020617 100%)`
        }}
      />
      
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="bg-orange-600 p-2.5 rounded-xl shadow-lg shadow-orange-600/20">
              <Trophy className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">DALE JOGOS</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">
                Por <span className="text-orange-500">Bruno e Leandro</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isCached && !loading && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-[10px] font-bold text-blue-400 uppercase">
                <Database className="w-3 h-3" />
                Dados em Cache
              </div>
            )}
            <button 
              onClick={() => loadData(true)}
              disabled={loading}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-full transition-all font-black text-[10px] tracking-widest uppercase disabled:opacity-50 shadow-lg shadow-orange-600/20"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
              {loading ? 'Buscando...' : 'Forçar Atualização'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-6 rounded-2xl flex flex-col md:flex-row items-start gap-4 mb-10 backdrop-blur-md">
            <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-black uppercase tracking-tighter">Erro de Conexão</p>
              <p className="text-sm opacity-90 mt-1">{error}</p>
              <button 
                onClick={() => loadData(true)}
                className="mt-4 bg-red-500 text-white px-5 py-2 rounded-full text-[10px] font-bold uppercase hover:bg-red-600 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3 mb-8">
          <div className="w-2 h-8 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.4)]"></div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Próximos Confrontos</h2>
        </div>

        {loading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-slate-900/50 rounded-2xl animate-pulse border border-white/5"></div>
            ))}
          </div>
        ) : sortedMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
            <Info className="w-10 h-10 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase text-sm tracking-widest">Nenhum jogo encontrado para o período</p>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-16 pt-8 border-t border-white/5">
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] mb-6">Fontes Consultadas</p>
            <div className="flex flex-wrap gap-3">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-slate-900 border border-white/5 px-4 py-2 rounded-lg text-slate-400 hover:text-orange-500 transition-colors flex items-center gap-2">
                  <ExternalLink className="w-3 h-3" /> {s.title}
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