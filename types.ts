export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  league: string;
  dateTime: string;
  status: 'LIVE' | 'SCHEDULED' | 'FINISHED';
  prediction?: string;
  score?: {
    home: number;
    away: number;
  };
  venue?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MatchDataResponse {
  matches: Match[];
  sources: GroundingSource[];
}