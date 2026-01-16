import React, { useState, useEffect, useMemo } from 'react';
import { fetchFootballMatches } from './services/geminiService';
import { Match, GroundingSource } from './types';
import MatchCard from './components/MatchCard';
import { Trophy, RefreshCw, Loader2, Info, Database, Zap, AlertTriangle, X } from 'lucide-react';

const App: React.FC = () => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [sources, setSources] = useState<GroundingSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<'api' | 'cache'>('api');
  const [cooldown, setCooldown] = useState(0);

  const loadData = async (force = false) => {
    if (force && cooldown > 0) return;
    
    setLoading(true);
    // Não limpamos o erro imediatamente para evitar flicker se for apenas um aviso de cache
    try {
      const result = await fetchFootballMatches(force);
      setMatches(result.matches || []);
      setSources(result.sources || []);
      setSourceType(result.dataSource);
      
      if (result.error) {
        setError(result.error);
      } else {
        setError(null);
      }

      if (force && result.dataSource === 'api') {
        setCooldown(60); // 1 minuto de cooldown após sucesso real
      }
    } catch (err: any) {
      console.error("Erro crítico:", err);
      setError(err.message || "Erro de conexão fatal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Timer para o cooldown
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => 
      new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
    );
  }, [matches]);

  return (
    <div className="min-h-screen pb-20 relative overflow-hidden bg-slate-950 font-sans text-slate-100">
      <div className="fixed inset-0 z-[-2] bg-[radial-gradient(circle_at_50%_50%,#1e293b_0%,#020617_100%)] opacity-40" />
      
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-900/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white uppercase tracking-tighter leading-none">DALE JOGOS</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Bruno & Leandro</span>
                {!loading && (
                  <span className={`flex items-center gap-1 text-[8px] px-2 py-0.5 rounded-full border uppercase font-black transition-colors ${
                    sourceType === 'api' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                  }`}>
                    {sourceType === 'api' ? <><Zap className="w-2 h-2 fill-current" /> Ao Vivo</> : <><Database className="w-2 h-2" /> Cache</>}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => loadData(true)}
            disabled={loading || cooldown > 0}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-bold text-[10px] tracking-widest uppercase border ${
              cooldown > 0 
              ? 'bg-slate-900/50 border-white/5 text-slate-500 cursor-not-allowed' 
              : 'bg-slate-900 border-white/10 hover:border-orange-500/50 text-white active:scale-95'
            }`}
          >
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className={`w-3 h-3 ${cooldown > 0 ? 'opacity-30' : ''}`} />}
            {loading ? 'Sincronizando...' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Atualizar Agora'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative">
        {/* Floating Error/Warning Notification */}
        {error && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md animate-in slide-in-from-bottom-8 fade-in duration-500">
            <div className="bg-slate-900/90 backdrop-blur-xl border border-orange-500/30 p-4 rounded-2xl shadow-2xl flex items-start gap-4">
              <div className="bg-orange-500/10 p-2 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-orange-400 font-black uppercase tracking-wider">Aviso de Sincronização</p>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed font-medium">{error}</p>
              </div>
              <button onClick={() => setError(null)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.4)]"></div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none">Agenda de Jogos</h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Brasileirão • Paulistão • Seleção</p>
            </div>
          </div>
          
          {sourceType === 'cache' && !loading && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <Database className="w-3 h-3 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400/80 uppercase">Modo Offline (Dados Salvos)</span>
            </div>
          )}
        </div>

        {loading && matches.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-56 bg-slate-900/40 rounded-3xl animate-pulse border border-white/5 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
              </div>
            ))}
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedMatches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-32 bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-white/5">
            <div className="bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/10">
              <Info className="w-8 h-8 text-slate-700" />
            </div>
            <p className="text-slate-400 font-black uppercase text-sm tracking-widest">Nenhuma partida agendada</p>
            <p className="text-slate-600 text-xs mt-2 max-w-xs mx-auto">Tente atualizar os dados em alguns instantes para buscar novas informações da IA.</p>
            <button 
              onClick={() => loadData(true)}
              className="mt-8 px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-full font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-orange-900/20"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-20 pt-10 border-t border-white/5">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Fontes de Dados</span>
              <div className="flex-1 h-px bg-white/5"></div>
            </div>
            <div className="flex flex-wrap gap-3">
              {sources.map((s, i) => (
                <a 
                  key={i} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="group flex items-center gap-2 text-[10px] bg-slate-900/50 backdrop-blur-sm px-4 py-2.5 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5 hover:border-orange-500/30 hover:bg-slate-800"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-orange-500 transition-colors"></span>
                  <span className="font-bold truncate max-w-[200px]">{s.title}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-12 py-8 text-center border-t border-white/5">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.4em]">Dale Jogos © 2024</p>
      </footer>
    </div>
  );
};

export default App;