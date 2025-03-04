import { NextResponse } from 'next/server';
import { GameService } from '../../../services/gameService';

export async function GET() {
  try {
    const service = new GameService();
    const games = await service.getGames();
    return NextResponse.json({ games });
  } catch (error) {
    console.error('Error in /api/games:', error);
    return NextResponse.json({ error: 'Failed to load games' }, { status: 500 });
  }
}