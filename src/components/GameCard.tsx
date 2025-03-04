import React from 'react';
import { Card, CardContent, Typography, Box, Chip } from '@mui/material';
import { Game, GameStatus, getFormattedDate, getFormattedTime } from '../types/game';
import * as NBAIcons from 'react-nba-logos';


const TeamLogo = ({ teamAbbreviation }: { teamAbbreviation: string }) => {
  const LogoComponent = NBAIcons[teamAbbreviation as keyof typeof NBAIcons];

  return LogoComponent ? <LogoComponent size={75} /> : <p>Logo not found</p>;
};

interface GameCardProps {
  game: Game;
  onClick: (game: Game) => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const isLive = game.gameStatus === GameStatus.LIVE;
  const isFinal = game.gameStatus === GameStatus.FINAL;
  
  return (
    <Card 
      onClick={() => onClick(game)}
      sx={{ 
        cursor: 'pointer',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        },
        background: 'rgba(36,38,39,0.9)',
        color: 'rgba(255,255,255,1)'
      }}
    >
      {isLive && (
        <Chip
          label="LIVE"
          color="error"
          size="small"
          sx={{
            position: 'absolute',
            top: -12,
            right: 16,
            animation: 'pulse 2s infinite'
          }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ mb: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="rgba(255,255,255,1)">
            {isFinal ? 'Final' : getFormattedDate(game.gameTime)}
            {!isFinal && ` • ${getFormattedTime(game.gameTime)}`}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.7)">
            {getFormattedDate(game.gameTime)}
          </Typography>
        </Box>
        
        {/* Game Teams Layout */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 2
        }}>
          {/* Away Team Column */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {game.awayTeamFullName}
            </Typography>
            <TeamLogo teamAbbreviation={game.awayTeamAbbrev.toUpperCase()} />
          </Box>

          {/* @ Symbol */}
          <Typography variant="h4" sx={{ fontWeight: 500 }}>
            @
          </Typography>

          {/* Home Team Column */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            gap: 2
          }}>
            <Typography variant="h6" sx={{ fontWeight: 500 }}>
              {game.homeTeamFullName}
            </Typography>
            <TeamLogo teamAbbreviation={game.homeTeamAbbrev.toUpperCase()} />
          </Box>
        </Box>

        {!isLive && !isFinal && (
          <Box sx={{ mt: 'auto', pt: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Click to watch when game starts
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default GameCard;