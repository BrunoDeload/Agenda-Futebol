
import React from 'react';
import { Match } from '../types';
import { Calendar, MapPin, Clock, Shield, Flame, Star } from 'lucide-react';

interface MatchCardProps {
  match: Match;
}

interface TeamStyle {
  primary: string;
  secondary: string;
  textColor: string;
  logo: string;
}

const TEAM_COLORS: Record<string, TeamStyle> = {
  'Corinthians': { 
    primary: '#000000', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/b/b4/Corinthians_simbolo.png'
  },
  'Palmeiras': { 
    primary: '#006437', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/Palmeiras_logo.svg'
  },
  'São Paulo': { 
    primary: '#FE0000', 
    secondary: '#000000', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/4/4b/S%C3%A3o_Paulo_Futebol_Clube.png'
  },
  'Santos': { 
    primary: '#f3f4f6', 
    secondary: '#000000', 
    textColor: '#111827',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/3/35/Santos_logo.svg'
  },
  'Brasil': {
    primary: '#FFDF00',
    secondary: '#009B3A',
    textColor: '#002776',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/b/bb/Logo_Confedera%C3%A7%C3%A3o_Brasileira_de_Futebol.png'
  },
  'Seleção Brasileira': {
    primary: '#FFDF00',
    secondary: '#009B3A',
    textColor: '#002776',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/b/bb/Logo_Confedera%C3%A7%C3%A3o_Brasileira_de_Futebol.png'
  },
  'Red Bull Bragantino': { 
    primary: '#E10631', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Red_Bull_Bragantino_logo.svg'
  },
  'RB Bragantino': { 
    primary: '#E10631', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/en/9/9e/Red_Bull_Bragantino_logo.svg'
  },
  'Guarani': { 
    primary: '#008040', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a2/Guarani_Futebol_Clube.png'
  },
  'Ponte Preta': { 
    primary: '#000000', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/a/a9/Associa%C3%A7%C3%A3o_Atl%C3%A9tica_Ponte_Preta.png'
  },
  'Ituano': { 
    primary: '#dc2626', 
    secondary: '#000000', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/0/07/Ituano_Futebol_Clube.png'
  },
  'Novorizontino': { 
    primary: '#fbbf24', 
    secondary: '#000000', 
    textColor: '#000000',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/4/45/Gr%C3%AAmio_Novorizontino.png'
  },
  'Mirassol': { 
    primary: '#facc15', 
    secondary: '#166534', 
    textColor: '#000000',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/3/3b/Mirassol_Futebol_Clube.png'
  },
  'Botafogo-SP': { 
    primary: '#dc2626', 
    secondary: '#ffffff', 
    textColor: '#ffffff',
    logo: 'https://upload.wikimedia.org/wikipedia/pt/e/e9/Botafogo_Futebol_Clube_SP.png'
  },
};

const DEFAULT_STYLE: TeamStyle = { 
  primary: '#334155', 
  secondary: '#475569', 
  textColor: '#ffffff',
  logo: '' 
};

const getTeamStyle = (name: string, opponentColor?: string): TeamStyle => {
  const normalized = Object.keys(TEAM_COLORS).find(k => name.toLowerCase().includes(k.toLowerCase()));
  const style = normalized ? TEAM_COLORS[normalized] : DEFAULT_STYLE;
  
  if (opponentColor && style.primary.toLowerCase() === opponentColor.toLowerCase()) {
    return { ...style, primary: style.secondary, textColor: style.secondary === '#ffffff' ? '#111827' : '#ffffff' };
  }
  
  return style;
};

const MatchCard: React.FC<MatchCardProps> = ({ match }) => {
  const date = new Date(match.dateTime);
  const now = new Date();
  const timeDiff = date.getTime() - now.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const isClose = daysRemaining >= 0 && daysRemaining <= 3;
  
  const isBrasilMatch = match.homeTeam.toLowerCase().includes('brasil') || match.awayTeam.toLowerCase().includes('brasil');
  
  const homeStyle = getTeamStyle(match.homeTeam);
  const awayStyle = getTeamStyle(match.awayTeam, homeStyle.primary);

  const formattedTime = date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short'
  });

  const cardBorderClass = isBrasilMatch 
    ? 'border-yellow-400 shadow-[0_0_20px_rgba(255,223,0,0.2)] ring-2 ring-green-600/30' 
    : isClose 
      ? 'border-orange-500/50 shadow-orange-500/10' 
      : 'border-slate-800';

  const headerBgClass = isBrasilMatch
    ? 'bg-green-600/20 border-green-600/30'
    : isClose
      ? 'bg-orange-500/10 border-orange-500/20'
      : 'bg-slate-800/50 border-slate-800';

  return (
    <div className={`bg-slate-900 border ${cardBorderClass} rounded-2xl overflow-hidden hover:scale-[1.02] transition-all duration-300 group shadow-xl flex flex-col relative`}>
      {/* Top Banner with League */}
      <div className={`px-4 py-2 flex justify-between items-center border-b ${headerBgClass}`}>
        <span className={`text-[10px] uppercase font-black tracking-widest ${isBrasilMatch ? 'text-yellow-400' : isClose ? 'text-orange-400' : 'text-slate-400'}`}>
          {match.league}
        </span>
        <div className="flex gap-1.5">
          {isBrasilMatch && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-400 text-green-900 text-[9px] font-black">
              <Star className="w-2.5 h-2.5 fill-current" />
              SELEÇÃO
            </div>
          )}
          {isClose && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${isBrasilMatch ? 'bg-green-600' : 'bg-orange-500'} text-white text-[9px] font-black`}>
              <Flame className="w-2.5 h-2.5" />
              {daysRemaining === 0 ? 'HOJE' : `EM ${daysRemaining} DIAS`}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex min-h-[160px] flex-1">
        {/* Left Side (Home) */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-4 transition-colors relative"
          style={{ backgroundColor: `${homeStyle.primary}15` }}
        >
          <div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-2xl border ${isBrasilMatch && match.homeTeam.toLowerCase().includes('brasil') ? 'border-yellow-400' : 'border-slate-700/50'} overflow-hidden bg-white p-2`}
          >
            {homeStyle.logo ? (
              <img src={homeStyle.logo} alt={match.homeTeam} className="w-full h-full object-contain" />
            ) : (
              <Shield className="w-10 h-10 text-slate-400" strokeWidth={2} />
            )}
          </div>
          <h3 className={`text-xs font-black text-center ${isBrasilMatch && match.homeTeam.toLowerCase().includes('brasil') ? 'text-yellow-400' : 'text-white'} uppercase leading-tight px-1 drop-shadow-md`}>
            {match.homeTeam}
          </h3>
          <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: homeStyle.primary }}></div>
        </div>

        {/* VS Center */}
        <div className="flex flex-col items-center justify-center z-10 px-3 bg-slate-900/40 backdrop-blur-sm border-x border-slate-800/50">
          <div className="text-xl font-black text-slate-500 flex flex-col items-center gap-1 leading-none">
            <span className="text-[10px] text-slate-400 font-black uppercase">VS</span>
          </div>
        </div>

        {/* Right Side (Away) */}
        <div 
          className="flex-1 flex flex-col items-center justify-center p-4 transition-colors relative"
          style={{ backgroundColor: `${awayStyle.primary}15` }}
        >
          <div 
            className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-3 shadow-2xl border ${isBrasilMatch && match.awayTeam.toLowerCase().includes('brasil') ? 'border-yellow-400' : 'border-slate-700/50'} overflow-hidden bg-white p-2`}
          >
            {awayStyle.logo ? (
              <img src={awayStyle.logo} alt={match.awayTeam} className="w-full h-full object-contain" />
            ) : (
              <Shield className="w-10 h-10 text-slate-400" strokeWidth={2} />
            )}
          </div>
          <h3 className={`text-xs font-black text-center ${isBrasilMatch && match.awayTeam.toLowerCase().includes('brasil') ? 'text-yellow-400' : 'text-white'} uppercase leading-tight px-1 drop-shadow-md`}>
            {match.awayTeam}
          </h3>
          <div className="absolute right-0 top-0 bottom-0 w-1" style={{ backgroundColor: awayStyle.primary }}></div>
        </div>
      </div>

      {/* Footer Details */}
      <div className={`p-4 border-t ${isBrasilMatch ? 'bg-green-950/20 border-green-600/20' : isClose ? 'bg-orange-500/5 border-orange-500/10' : 'bg-slate-800/40 border-slate-800'} flex flex-wrap items-center justify-between gap-3`}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
            <Calendar className={`w-3 h-3 ${isBrasilMatch ? 'text-green-500' : isClose ? 'text-orange-500' : 'text-slate-500'}`} />
            {formattedDate}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
            <Clock className={`w-3 h-3 ${isBrasilMatch ? 'text-green-500' : isClose ? 'text-orange-500' : 'text-slate-500'}`} />
            {formattedTime}
          </div>
        </div>
        {match.venue && (
          <div className={`flex items-center gap-1.5 text-[10px] font-bold text-slate-500 max-w-[140px] truncate ${isBrasilMatch ? 'bg-green-600/10' : 'bg-slate-900/50'} px-2 py-1 rounded`}>
            <MapPin className={`w-3 h-3 flex-shrink-0 ${isBrasilMatch ? 'text-green-500' : isClose ? 'text-orange-500' : 'text-slate-500'}`} />
            {match.venue}
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchCard;
