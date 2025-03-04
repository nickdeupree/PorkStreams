import { JSDOM } from 'jsdom';
import { Game, GameStatus } from '../types/game';

const BASE_URL = 'https://topstreams.info/nba/warriors';
const UTC_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: 'UTC',
  year: 'numeric', 
  month: '2-digit', 
  day: '2-digit',
  hour: '2-digit', 
  minute: '2-digit', 
  second: '2-digit',
  hour12: false
});

export class GameService {
  
  async getGames(): Promise<Game[]> {
    try {
      const response = await fetch(BASE_URL);
      
      if (!response.ok) {
        console.error('Failed to fetch games from TopStreams');
        return this.getDummyGames();
      }
      
      const html = await response.text();
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const upcomingGames = document.querySelectorAll('.item.upcoming');
      
      const games: Game[] = [];
      
      upcomingGames.forEach((gameElement) => {
        const game = this.parseGameElement(gameElement);
        if (game) {
          games.push(game);
        }
      });
      
      return games.length ? games : this.getDummyGames();
    } catch (error) {
      console.error('Error fetching games:', error);
      return this.getDummyGames();
    }
  }
  
  private parseGameElement(element: Element): Game | null {
    try {
      const gameId = element.getAttribute('data-id') || '';
      
      // Parse team information
      const awayTeamElement = element.querySelector('.away-content .text');
      const homeTeamElement = element.querySelector('.home-content .text');
      
      if (!awayTeamElement || !homeTeamElement) {
        return null;
      }
      
      const awayTeamAbbrev = awayTeamElement.querySelector('.code')?.textContent || '';
      const homeTeamAbbrev = homeTeamElement.querySelector('.code')?.textContent || '';
      
      const awayTeamName = awayTeamElement.querySelector('.name')?.textContent || '';
      const homeTeamName = homeTeamElement.querySelector('.name')?.textContent || '';
      
      const awayScoreText = awayTeamElement.querySelector('.score')?.textContent || '0';
      const homeScoreText = homeTeamElement.querySelector('.score')?.textContent || '0';
      
      const awayScore = parseInt(awayScoreText, 10) || 0;
      const homeScore = parseInt(homeScoreText, 10) || 0;
      
      // Parse date/time - look for script that contains the date
      const dateElement = element.querySelector('.game-desc .date');
      const dateId = dateElement?.getAttribute('id') || '';
      
      // Find script containing the date
      const scripts = element.querySelectorAll('script');
      let gameDate = new Date();
      
      for (let i = 0; i < scripts.length; i++) {
        const scriptContent = scripts[i].textContent || '';
        if (scriptContent.includes(dateId)) {
          const dateStr = scriptContent
            .split("moment('")[1]?.split("')")[0];
          
          if (dateStr) {
            gameDate = new Date(dateStr);
          }
          break;
        }
      }

      // Determine game status
      const currentTime = new Date();
      const gameStartTime = gameDate;
      
      const twoHoursThirtyMinsInMillis = 2.5 * 60 * 60 * 1000;
      const gameEndTime = new Date(gameStartTime.getTime() + twoHoursThirtyMinsInMillis);

      const gameStatus = this.determineGameStatus(currentTime, gameStartTime, gameEndTime);
      
      return {
        gameId,
        homeTeam: homeTeamName.toLowerCase(),
        awayTeam: awayTeamName.toLowerCase(),
        homeTeamFullName: homeTeamName,
        awayTeamFullName: awayTeamName,
        homeTeamAbbrev,
        awayTeamAbbrev,
        homeScore,
        awayScore,
        gameTime: gameDate,
        gameStatus
      };
    } catch (error) {
      console.error('Error parsing game element:', error);
      return null;
    }
  }
  
  private determineGameStatus(currentTime: Date, gameStartTime: Date, gameEndTime: Date): GameStatus {
    if (currentTime < gameStartTime) {
      return GameStatus.UPCOMING;
    } else if (currentTime > gameEndTime) {
      return GameStatus.FINAL;
    } else {
      return GameStatus.LIVE;
    }
  }
  
  private getDummyGames(): Game[] {
    const calendar = new Date();
    
    // Create a game that started 1 hour ago (should be live)
    const liveGameTime = new Date();
    liveGameTime.setHours(liveGameTime.getHours() - 1);
    
    // Create a game starting in 2 hours (upcoming)
    const game2Time = new Date();
    game2Time.setHours(game2Time.getHours() + 2);
    
    // Create a game starting in 3 hours (upcoming)
    const game3Time = new Date();
    game3Time.setHours(game3Time.getHours() + 3);
    
    return [
      {
        gameId: '1',
        homeTeam: 'timberwolves',
        awayTeam: 'lakers',
        gameTime: liveGameTime,
        homeTeamFullName: 'Timberwolves',
        awayTeamFullName: 'Lakers',
        homeTeamAbbrev: 'MIN',
        awayTeamAbbrev: 'LAL',
        homeScore: 89,
        awayScore: 92,
        gameStatus: GameStatus.LIVE
      },
      {
        gameId: '2',
        homeTeam: 'warriors',
        awayTeam: 'suns',
        gameTime: game2Time,
        homeTeamFullName: 'Warriors',
        awayTeamFullName: 'Suns',
        homeTeamAbbrev: 'GSW', 
        awayTeamAbbrev: 'PHX',
        homeScore: 0,
        awayScore: 0,
        gameStatus: GameStatus.UPCOMING
      },
      {
        gameId: '3',
        homeTeam: 'mavericks',
        awayTeam: 'celtics',
        gameTime: game3Time,
        homeTeamFullName: 'Mavericks',
        awayTeamFullName: 'Celtics',
        homeTeamAbbrev: 'DAL',
        awayTeamAbbrev: 'BOS',
        homeScore: 0,
        awayScore: 0,
        gameStatus: GameStatus.UPCOMING
      }
    ];
  }
}