import React from 'react';
import { Match } from '../types';
import { Calendar, MapPin, Clock, Shield, Star, TrendingUp } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const date = new Date(match.dateTime);
  const isLive = match.status === 'LIVE';
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getTeamGradient = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('corinthians') || n.includes('santos') || n.includes('ponte')) return 'from-slate-700 to-slate-900';
    if (n.includes('palmeiras') || n.includes('guarani')) return 'from-green-600 to-green-900';
    if (n.includes('são paulo') || n.includes('bragantino') || n.includes('ituano')) return 'from-red-600 to-red-900';
    if (n.includes('brasil')) return 'from-yellow-400 to-green-600';
    return 'from-slate-800 to-slate-950';
  };

  return (
    <div className={`group relative bg-slate-900/40 rounded-[2rem] border ${isLive ? 'border-orange-500 shadow-[0_0_30px_rgba(249,115,22,0.15)]' : 'border-white/5'} overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:bg-slate-900/60`}>
      {/* Header Banner */}
      <div className={`px-6 py-3 flex items-center justify-between ${isLive ? 'bg-orange-500' : 'bg-white/5'}`}>
        <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${isLive ? 'text-white' : 'text-slate-500'}`}>
          {match.league}
        </span>
        {isLive && (
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-white rounded-full">
            <div className="w-1.5 h-1.5 bg-orange-600 rounded-full animate-ping"></div>
            <span className="text-[9px] font-black text-orange-600 uppercase">Ao Vivo</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="p-8 pb-4">
        <div className="flex items-center justify-between gap-4">
          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTeamGradient(match.homeTeam)} shadow-xl flex items-center justify-center border border-white/10 mb-3 group-hover:rotate-3 transition-transform`}>
               <span className="font-oswald text-xl text-white opacity-80">{getInitials(match.homeTeam)}</span>
            </div>
            <h3 className="font-oswald text-sm text-white uppercase tracking-tight leading-none h-8 flex items-center">
              {match.homeTeam}
            </h3>
          </div>

          {/* VS Divider */}
          <div className="flex flex-col items-center gap-2">
            <div className="text-[10px] font-black text-slate-700 bg-slate-950 px-3 py-1 rounded-full border border-white/5 uppercase tracking-widest">
              VS
            </div>
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-slate-800 to-transparent"></div>
          </div>

          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center text-center">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getTeamGradient(match.awayTeam)} shadow-xl flex items-center justify-center border border-white/10 mb-3 group-hover:-rotate-3 transition-transform`}>
              <span className="font-oswald text-xl text-white opacity-80">{getInitials(match.awayTeam)}</span>
            </div>
            <h3 className="font-oswald text-sm text-white uppercase tracking-tight leading-none h-8 flex items-center">
              {match.awayTeam}
            </h3>
          </div>
        </div>

        {/* Prediction Badge */}
        {match.prediction && (
          <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl border border-white/5">
            <TrendingUp className="w-3 h-3 text-orange-500" />
            <span className="text-[9px] font-bold text-slate-400 uppercase leading-none truncate italic">
              Predição: {match.prediction}
            </span>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-6 mt-4 bg-slate-950/40 flex flex-wrap items-center justify-between gap-4 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] font-black text-slate-400 uppercase">
              {date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] font-black text-slate-400">
              {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {match.venue && (
          <div className="flex items-center gap-2 max-w-[120px]">
            <MapPin className="w-3 h-3 text-slate-600 flex-shrink-0" />
            <span className="text-[9px] font-bold text-slate-500 uppercase truncate">
              {match.venue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;