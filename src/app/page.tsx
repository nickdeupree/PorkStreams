'use client';
import { useEffect, useState } from 'react';
import { Box, Container, IconButton, Skeleton, Alert, Typography } from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { Game, GameStatus } from '../types/game';
import GameSection from '../components/GameSection';
import VideoPlayer from '../components/VideoPlayer';
import AppHeader from '../components/AppHeader';

const GameSkeleton = () => (
  <Box sx={{ mb: 4 }}>
    <Skeleton variant="text" width={200} height={40} sx={{ mb: 2 }} />
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 2 }}>
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} variant="rounded" height={200} />
      ))}
    </Box>
  </Box>
);

export default function Home() {
  const [games, setGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setError(null);
      const response = await fetch('/api/games');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setGames(data.games);
    } catch (err) {
      console.error('Error fetching games:', err);
      setError('Failed to load games. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGameSelect = (game: Game) => setSelectedGame(game);
  const handleBackToGames = () => setSelectedGame(null);

  const liveGames = games?.filter(g => g?.gameStatus === GameStatus.LIVE) || [];
  const upcomingGames = games?.filter(g => g?.gameStatus === GameStatus.UPCOMING) || [];
  const finalGames = games?.filter(g => g?.gameStatus === GameStatus.FINAL) || [];

  if (selectedGame) {
    return (
      <Box sx={{ height: '100vh', bgcolor: 'black', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <IconButton
          onClick={handleBackToGames}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.5)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <VideoPlayer game={selectedGame} />
      </Box>
    );
  }

  return (
    <>
      <AppHeader liveGamesCount={liveGames.length} upcomingGamesCount={upcomingGames.length} />
      <Container
        maxWidth="xl"
        sx={{
          py: 4,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {loading ? (
          <>
            <GameSkeleton />
            <GameSkeleton />
            <GameSkeleton />
          </>
        ) : games.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}>
            <Typography variant="h6" color="text.secondary">
              No games available at the moment
            </Typography>
          </Box>
        ) : (
          <>
            {liveGames.length > 0 && (
              <GameSection title="Live" games={liveGames} onGameSelect={handleGameSelect} />
            )}
            {upcomingGames.length > 0 && (
              <GameSection title="Upcoming" games={upcomingGames} onGameSelect={handleGameSelect} />
            )}
            {finalGames.length > 0 && (
              <GameSection title="Final" games={finalGames} onGameSelect={handleGameSelect} />
            )}
          </>
        )}
      </Container>
    </>
  );
}