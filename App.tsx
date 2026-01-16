import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, RefreshCw, Loader2, Database, Zap, AlertTriangle, Filter, ChevronRight, Clock } from 'lucide-react';

const LEAGUES = ["Todos", "Brasileirão", "Paulistão", "Libertadores", "Copa do Brasil"];

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sourceType, setSourceType] = useState<'api' | 'cache' | 'fallback'>('api');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const loadData = async (force = false) => {
    if (force && cooldown > 0) return;
    
    setLoading(true);
    try {
      const result = await fetchFootballMatches(force);
      setMatches(result.matches || []);
      setSources(result.sources || []);
      setSourceType(result.dataSource);
      setIsRateLimited(!!result.isRateLimited);
      setLastUpdated(result.lastUpdated || null);
      setError(result.error || null);
      
      if (result.isRateLimited || result.dataSource === 'api') {
        setCooldown(60); // 1 minuto de cooldown para proteger a API
      }
    } catch (err) {
      setError("Erro crítico ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const filteredMatches = useMemo(() => {
    let list = [...matches];
    if (activeFilter !== "Todos") {
      list = list.filter(m => m.league.toLowerCase().includes(activeFilter.toLowerCase()));
    }
    return list.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  }, [matches, activeFilter]);

  const getTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return "agora há pouco";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    return `há ${hours}h`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 selection:bg-orange-500/30">
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
              <div className="flex items-center gap-2 mt-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Premium • Bruno & Leandro</p>
                {lastUpdated && (
                  <span className="text-[9px] text-slate-600 font-bold flex items-center gap-1">
                    <Clock className="w-2 h-2" /> {getTimeAgo(lastUpdated)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={() => loadData(true)}
            disabled={loading || cooldown > 0}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${
              cooldown > 0
              ? 'bg-slate-900/50 border-white/5 text-slate-600 cursor-not-allowed'
              : 'bg-white text-black hover:bg-orange-500 hover:text-white border-white/10 active:scale-95'
            }`}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {loading ? 'Sincronizando' : cooldown > 0 ? `Cooldown ${cooldown}s` : 'Atualizar'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Banner de Aviso 429 */}
        {error && (
          <div className="mb-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
            <div className="bg-orange-500/20 p-2 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-wider">Modo de Preservação de Dados</p>
              <p className="text-xs text-slate-400 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <div className="flex bg-slate-900/50 p-1 rounded-2xl border border-white/5 mb-10 overflow-x-auto no-scrollbar">
          {LEAGUES.map(league => (
            <button
              key={league}
              onClick={() => setActiveFilter(league)}
              className={`flex-shrink-0 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeFilter === league 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/40' 
                : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {league}
            </button>
          ))}
        </div>

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
            <Filter className="w-16 h-16 text-slate-800 mx-auto mb-6" />
            <h3 className="font-oswald text-xl text-white uppercase">Sem resultados</h3>
            <p className="text-slate-500 text-xs mt-2">Tente outro filtro ou aguarde a atualização.</p>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-24 pt-12 border-t border-white/5">
            <h4 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em] mb-8 flex items-center gap-4">
              Fontes Verificadas <div className="flex-1 h-px bg-white/5"></div>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {sources.slice(0, 4).map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-4 bg-slate-900/30 hover:bg-slate-900 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all">
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-white truncate pr-4">{s.title}</span>
                  <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-orange-500" />
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-white/5 text-center">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.5em]">2024 • MONITORAMENTO ESPORTIVO ATIVO</p>
      </footer>
    </div>
  );
};

export default App;