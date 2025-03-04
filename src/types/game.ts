export enum GameStatus {
  UPCOMING = 'UPCOMING',
  PREGAME = 'PREGAME',
  LIVE = 'LIVE',
  FINAL = 'FINAL'
}

export interface Game {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFullName: string;
  awayTeamFullName: string;
  homeTeamAbbrev: string;
  awayTeamAbbrev: string;
  homeScore: number;
  awayScore: number;
  gameTime: Date;
  gameStatus: GameStatus;
}

// Game utility functions
export const getFormattedDate = (gameTime: Date): string => {
  const date = new Date(gameTime);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

export const getFormattedTime = (gameTime: Date): string => {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(gameTime);
};

export const getMatchupTitle = (game: Game): string => {
  return `${game.awayTeamFullName} @ ${game.homeTeamFullName}`;
};

export const getStreamUrl = (game: Game): string => {
  // TopStreams uses the home team name in lowercase for the stream URL
  return `https://topstreams.info/nba/${game.homeTeam.toLowerCase()}`;
};

export const isGameLive = (game: Game): boolean => {
  const now = new Date();
  const twoHoursThirtyMinutes = 2.5 * 60 * 60 * 1000; // in milliseconds
  
  // Game is live if current time is after game start time and within 2.5 hours
  return now.getTime() >= game.gameTime.getTime() && 
         now.getTime() <= (game.gameTime.getTime() + twoHoursThirtyMinutes);
};

export const getGameStatus = (game: Game): string => {
  return game.gameStatus;
};