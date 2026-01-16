import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, RefreshCw, Loader2, Database, Zap, AlertTriangle, Filter, ChevronRight } from 'lucide-react';

const LEAGUES = ["Todos", "Brasileirão", "Paulistão", "Libertadores", "Copa do Brasil"];

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sourceType, setSourceType] = useState<'api' | 'cache'>('api');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const loadData = async (force = false) => {
    if (force && isRateLimited && countdown > 0) return;
    
    setLoading(true);
    try {
      const result = await fetchFootballMatches(force);
      setMatches(result.matches || []);
      setSources(result.sources || []);
      setSourceType(result.dataSource);
      setIsRateLimited(!!result.isRateLimited);
      
      if (result.isRateLimited) {
        setCountdown(60); // Cooldown de 1 min se houver erro 429
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isRateLimited) {
      setIsRateLimited(false);
    }
  }, [countdown, isRateLimited]);

  const filteredMatches = useMemo(() => {
    let list = [...matches];
    if (activeFilter !== "Todos") {
      list = list.filter(m => m.league.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    return list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [matches, activeFilter]);

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-orange-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      <header className="sticky top-0 z-50 bg-[#020617]/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-950/20 ring-1 ring-white/20">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-oswald text-2xl tracking-tighter text-white leading-none">DALE JOGOS</h1>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Dashboard Premium • Bruno & Leandro</p>
            </div>
          </div>

          <div className="hidden md:flex bg-slate-900/50 p-1 rounded-xl border border-white/5">
            {LEAGUES.map(league => (
              <button
                key={league}
                onClick={() => setActiveFilter(league)}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  activeFilter === league 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' 
                  : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {league}
              </button>
            ))}
          </div>

          <button 
            onClick={() => loadData(true)}
            disabled={loading || (isRateLimited && countdown > 0)}
            className={`relative flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all overflow-hidden border ${
              isRateLimited && countdown > 0
              ? 'bg-slate-900/50 border-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-white text-black hover:bg-orange-500 hover:text-white border-white/10 active:scale-95'
            }`}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {loading ? 'Sincronizando' : isRateLimited && countdown > 0 ? `Limitação: ${countdown}s` : 'Atualizar'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Status Bar */}
        <div className="flex flex-wrap items-center gap-4 mb-10">
          <div className="flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-white/5">
            <div className={`w-2 h-2 rounded-full ${sourceType === 'api' ? 'bg-green-500 animate-pulse' : 'bg-blue-500'}`}></div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {sourceType === 'api' ? 'Dados em Tempo Real' : 'Modo Econômico (Cache)'}
            </span>
          </div>
          {isRateLimited && (
            <div className="flex items-center gap-2 bg-orange-500/10 px-4 py-2 rounded-full border border-orange-500/20 animate-pulse">
              <AlertTriangle className="w-3 h-3 text-orange-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Limite da API detectado</span>
            </div>
          )}
        </div>

        {/* Filters Mobile */}
        <div className="md:hidden overflow-x-auto flex gap-2 mb-8 pb-2 no-scrollbar">
          {LEAGUES.map(league => (
            <button
              key={league}
              onClick={() => setActiveFilter(league)}
              className={`flex-shrink-0 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase border transition-all ${
                activeFilter === league ? 'bg-orange-600 border-orange-500 text-white' : 'bg-slate-900 border-white/5 text-slate-500'
              }`}
            >
              {league}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading && filteredMatches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/40 rounded-[2rem] border border-white/5 animate-pulse"></div>
            ))}
          </div>
        ) : filteredMatches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : (
          <div className="text-center py-40">
            <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5">
              <Filter className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="font-oswald text-xl text-white uppercase tracking-wider">Sem partidas nesta categoria</h3>
            <p className="text-slate-500 text-xs mt-2 font-medium">Tente alterar o filtro ou atualizar os dados.</p>
          </div>
        )}

        {/* Sources */}
        {sources.length > 0 && (
          <div className="mt-24 pt-12 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              Fontes de Verificação <div className="flex-1 h-px bg-white/5"></div>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sources.slice(0, 4).map((s, i) => (
                <a 
                  key={i} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all"
                >
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-white truncate pr-4">{s.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-orange-500 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-white/5"></div>
          <Trophy className="w-4 h-4 text-slate-700" />
          <div className="w-8 h-px bg-white/5"></div>
        </div>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.5em]">2024 • SISTEMA DE MONITORAMENTO ESPORTIVO</p>
      </footer>
    </div>
  );
};

export default App;