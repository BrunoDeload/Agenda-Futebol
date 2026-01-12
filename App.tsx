import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, AlertCircle, ExternalLink, RefreshCw, Loader2, Info } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFootballMatches();
      setMatches(data.matches || []);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error("Erro capturado:", err);
      setError(err.message || "Erro inesperado ao buscar jogos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sortedMatches = useMemo(() => {
    if (!matches) return [];
    return [...matches].sort((a, b) => {
      const dateA = new Date(a.dateTime).getTime();
      const dateB = new Date(b.dateTime).getTime();
      return (isNaN(dateA) ? Infinity : dateA) - (isNaN(dateB) ? Infinity : dateB);
    });
  }, [matches]);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div 
        className="fixed inset-0 z-[-2] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.98)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-orange-600 p-3 rounded-2xl shadow-2xl shadow-orange-600/40 ring-4 ring-orange-600/10">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter leading-none mb-1">DALE JOGOS</h1>
              <p className="text-sm text-slate-400 font-medium tracking-wide">
                Criado por <span className="text-orange-500 font-bold uppercase underline underline-offset-4 decoration-orange-500/30">Bruno e Leandro</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-slate-300 px-6 py-3 rounded-full border border-white/10 transition-all font-black text-[10px] tracking-widest uppercase disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {loading ? 'Buscando...' : 'Atualizar Agenda'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-2xl flex flex-col md:flex-row items-start gap-4 mb-10 backdrop-blur-md shadow-2xl">
            <AlertCircle className="w-8 h-8 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-black uppercase tracking-tighter text-lg">Alerta do Sistema</p>
              <p className="text-sm opacity-90 font-medium mt-1 mb-4">{error}</p>
              {error.includes("429") && (
                <div className="flex items-center gap-2 text-xs bg-red-500/20 p-3 rounded-lg border border-red-500/30 mb-4">
                  <Info className="w-4 h-4" />
                  <span>Isso significa que o Google limitou seu acesso temporariamente. Tente novamente em alguns minutos.</span>
                </div>
              )}
              <button 
                onClick={loadData}
                className="bg-red-500 text-white px-6 py-2 rounded-full text-xs font-bold uppercase hover:bg-red-700 transition-colors shadow-lg"
              >
                Tentar reconectar
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 border-b border-white/5 pb-6 gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-100 uppercase tracking-tight flex items-center gap-3">
              <span className="w-1.5 h-8 bg-green-500 rounded-full shadow-[0_0_12px_rgba(34,197,94,0.5)]"></span>
              AGENDA DE JOGOS
            </h2>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Times Paulistas & Seleção Brasileira (Próximos 3 Meses)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 animate-pulse backdrop-blur-sm shadow-xl">
                <div className="h-4 w-24 bg-white/5 rounded mb-8"></div>
                <div className="flex justify-between items-center mb-8 px-2">
                  <div className="w-16 h-16 bg-white/5 rounded-2xl"></div>
                  <div className="h-4 w-8 bg-white/5 rounded"></div>
                  <div className="w-16 h-16 bg-white/5 rounded-2xl"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sortedMatches.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {sortedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : !error && (
          <div className="text-center py-32 bg-slate-950/40 border border-dashed border-white/10 rounded-[40px] backdrop-blur-md">
            <Trophy className="w-12 h-12 text-slate-700 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-200 uppercase tracking-tight">SEM JOGOS NO MOMENTO</h3>
          </div>
        )}

        {!loading && sources.length > 0 && (
          <div className="mt-24 pt-12 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-8 text-center md:text-left">
              FONTES DE INFORMAÇÃO
            </h4>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-slate-400 hover:text-green-500 font-bold flex items-center gap-2 bg-slate-900/60 px-5 py-3 rounded-2xl border border-white/5 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {source.title}
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