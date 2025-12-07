import { createContext, useContext, useRef } from 'react';
import { Vector3 } from 'three';

export type GameState = 'CONE' | 'SCATTER' | 'FOCUS';

export interface HandData {
  gesture: 'FIST' | 'OPEN' | 'PINCH' | 'NONE';
  position: { x: number; y: number; z: number };
  rotation: number; // Hand rotation for camera control
  isTracking: boolean;
}

interface GameContextType {
  handRef: React.MutableRefObject<HandData>;
  gameState: React.MutableRefObject<GameState>;
  focusedPhotoId: React.MutableRefObject<string | null>;
}

const GameContext = createContext<GameContextType | null>(null);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const handRef = useRef<HandData>({
    gesture: 'NONE',
    position: { x: 0, y: 0, z: 0 },
    rotation: 0,
    isTracking: false,
  });
  
  const gameState = useRef<GameState>('CONE');
  const focusedPhotoId = useRef<string | null>(null);

  return (
    <GameContext.Provider value={{ handRef, gameState, focusedPhotoId }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
