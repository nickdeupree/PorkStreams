import React from 'react';
import { Box, Typography, Grid } from '@mui/material';
import { Game } from '../types/game';
import GameCard from './GameCard';

interface GameSectionProps {
  title: string;
  games: Game[];
  onGameSelect: (game: Game) => void;
}

const GameSection: React.FC<GameSectionProps> = ({ title, games, onGameSelect }) => {
  if (!games || games.length === 0) {
    return null;
  }
  
  return (
    <Box sx={{ mb: 4 }}>
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          mb: 2, 
          fontWeight: title === 'Live' ? 'bold' : 'normal',
          color: title === 'Live' ? 'error.main' : 'inherit'
        }}
      >
        {title} Games
      </Typography>
      
      <Grid container spacing={2}>
        {games.map((game) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={game.gameId}>
            <GameCard game={game} onClick={onGameSelect} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default GameSection;