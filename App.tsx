
import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, AlertCircle, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    console.log("Iniciando busca de dados...");
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFootballMatches();
      console.log("Dados recebidos:", data);
      setMatches(data.matches || []);
      setSources(data.sources || []);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || "Erro desconhecido ao conectar com a API.");
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
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateA - dateB;
    });
  }, [matches]);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Football Field Background Overlay */}
      <div 
        className="fixed inset-0 z-[-2] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.98)), url('https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Field Lines & Grass Pattern Overlay */}
      <div className="fixed inset-0 z-[-1] opacity-[0.15] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_100px,rgba(34,197,94,0.1)_100px,rgba(34,197,94,0.1)_200px)]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[70vh] border-2 border-white/10 rounded-sm">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-white/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/10 rounded-full" />
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-32 h-64 border-2 border-white/10 border-l-0" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-32 h-64 border-2 border-white/10 border-r-0" />
        </div>
      </div>

      {/* Header */}
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-8 rounded-2xl flex items-start gap-4 mb-10 backdrop-blur-md shadow-2xl">
            <AlertCircle className="w-8 h-8 mt-0.5" />
            <div>
              <p className="font-black uppercase tracking-tighter text-lg">Erro na Conexão</p>
              <p className="text-sm opacity-90 font-medium mt-1 mb-4">{error}</p>
              <button 
                onClick={loadData}
                className="bg-red-500 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-red-600 transition-colors"
              >
                Tentar novamente
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
          <div className="flex items-center gap-6 bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 shadow-xl">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_8px_rgba(255,223,0,0.6)]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleção</span>
            </div>
            <div className="w-px h-4 bg-white/10" />
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.6)]"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Paulistas</span>
            </div>
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
                <div className="space-y-3">
                  <div className="h-3 w-3/4 bg-white/5 rounded"></div>
                  <div className="h-3 w-1/2 bg-white/5 rounded"></div>
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
          <div className="text-center py-32 bg-slate-950/60 border border-dashed border-white/10 rounded-[40px] backdrop-blur-md shadow-2xl">
            <div className="bg-slate-900 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-2xl">
              <Trophy className="w-12 h-12 text-slate-700" />
            </div>
            <h3 className="text-2xl font-black text-slate-200 uppercase tracking-tight">SEM JOGOS NO MOMENTO</h3>
            <p className="text-slate-500 mt-4 max-w-sm mx-auto font-medium text-sm px-4">
              Nenhuma partida encontrada para o critério selecionado nos próximos 90 dias.
            </p>
          </div>
        )}

        {/* Sources Footer */}
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
                  className="text-[11px] text-slate-400 hover:text-green-500 font-bold flex items-center gap-2 bg-slate-900/60 px-5 py-3 rounded-2xl border border-white/5 transition-all hover:border-green-500/30 backdrop-blur-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {source.title.length > 35 ? source.title.substring(0, 35) + '...' : source.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom UI for Mobile */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-950/95 backdrop-blur-3xl border border-white/10 rounded-full px-8 py-4 shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex items-center gap-12 md:hidden">
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="text-green-500 flex flex-col items-center gap-1 transition-transform active:scale-95"
        >
          <Trophy className="w-7 h-7" />
          <span className="text-[9px] font-black uppercase tracking-tighter">Agenda</span>
        </button>
        <button 
          onClick={loadData}
          disabled={loading}
          className="text-slate-400 flex flex-col items-center gap-1 active:scale-95 transition-all disabled:opacity-30"
        >
          {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : <RefreshCw className="w-7 h-7" />}
          <span className="text-[9px] font-black uppercase tracking-tighter">Recarregar</span>
        </button>
      </div>
    </div>
  );
};

export default App;
