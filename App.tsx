import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { MapEditor, EditorState } from './components/MapEditor'; // Import EditorState
import { GAME_DATA } from './constants';
import { GameState, LevelConfig } from './types';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentLevelId: 1,
    status: 'MENU',
    health: GAME_DATA.player.health.max,
    weapon: null,
    ammo: GAME_DATA.player.combat.defaultAmmo,
    activeInfo: null,
    hasKey: false
  });

  const [gameKey, setGameKey] = useState(0);
  const [transitionState, setTransitionState] = useState<'IDLE' | 'FADE_OUT' | 'FADE_IN'>('IDLE');
  const [customLevelData, setCustomLevelData] = useState<LevelConfig | undefined>(undefined);
  
  // Store editor state to resume later
  const [editorState, setEditorState] = useState<EditorState | undefined>(undefined);
  
  // Track inputs for touch controls
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());

  // Determine current level config (custom or built-in)
  const currentLevelConfig = customLevelData || GAME_DATA.levels.find(l => l.id === gameState.currentLevelId);

  // Keyboard Pause Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
            if (gameState.status === 'PLAYING') {
                setGameState(prev => ({ ...prev, status: 'PAUSED' }));
            } else if (gameState.status === 'PAUSED') {
                setGameState(prev => ({ ...prev, status: 'PLAYING' }));
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status]);

  const startGame = () => {
    setCustomLevelData(undefined); // Reset custom data
    setGameState({
      ...gameState,
      status: 'PLAYING',
      currentLevelId: 1,
      health: 1,
      weapon: null,
      ammo: GAME_DATA.player.combat.defaultAmmo,
      activeInfo: null,
      hasKey: false
    });
    setGameKey(prev => prev + 1);
  };

  const startEditor = () => {
    setGameState(prev => ({ ...prev, status: 'EDITOR' }));
  };

  // Called from Editor to playtest
  const startTestLevel = (levelData: LevelConfig, currentEditorState: EditorState) => {
      setCustomLevelData(levelData);
      setEditorState(currentEditorState); // Persist editor state
      setGameState({
          currentLevelId: 999, // ID used for custom levels
          status: 'PLAYING',
          health: 1,
          weapon: 'light_gun',
          ammo: 999,
          activeInfo: "Testing Custom Level",
          hasKey: false
      });
      setGameKey(prev => prev + 1);
  };

  const togglePause = () => {
      if (gameState.status === 'PLAYING') {
          setGameState(prev => ({ ...prev, status: 'PAUSED' }));
      } else if (gameState.status === 'PAUSED') {
          setGameState(prev => ({ ...prev, status: 'PLAYING' }));
      }
  };

  const handleLevelComplete = (nextLevelId: number) => {
    setTransitionState('FADE_OUT');
    setTimeout(() => {
        
        // If testing custom level, go back to VICTORY first (which allows going back to editor)
        // Or we can just show victory screen and a "Back to Editor" button?
        // Let's reuse VICTORY state but UI will handle it differently if ID is 999
        if (gameState.currentLevelId === 999) {
             setGameState(prev => ({ ...prev, status: 'VICTORY' }));
             setTransitionState('IDLE');
             return;
        }

        const nextLevel = GAME_DATA.levels.find(l => l.id === nextLevelId);
        
        // Updated Victory Logic: Check if next level loops back to 1 from Level 6
        if (nextLevelId === 1 && gameState.currentLevelId === 6) {
            setGameState(prev => ({ ...prev, status: 'VICTORY' }));
            setTransitionState('IDLE');
            return;
        }

        if (nextLevel) {
            setGameState(prev => ({
                ...prev,
                currentLevelId: nextLevelId,
                // Give ammo if level has a gun
                weapon: nextLevel.items?.some(i => i.weapon === 'light_gun') ? 'light_gun' : prev.weapon,
                ammo: nextLevel.items?.some(i => i.weapon === 'light_gun') ? GAME_DATA.player.combat.defaultAmmo : prev.ammo,
                // Reset key for next level
                hasKey: false
            }));
        }
        setTransitionState('FADE_IN');
        setTimeout(() => setTransitionState('IDLE'), 500);
    }, 500);
  };

  const handlePlayerDeath = () => {
    setGameState(prev => ({ ...prev, status: 'DIED' }));
  };

  const handleRestartLevel = () => {
    setGameState(prev => ({
      ...prev,
      status: 'PLAYING',
      health: 1,
      ammo: GAME_DATA.player.combat.defaultAmmo,
      activeInfo: null,
      hasKey: false
    }));
    setGameKey(prev => prev + 1);
  };

  const handleQuitToMenu = () => {
      // If we are testing a level (ID 999) and quit, go back to editor
      if (gameState.currentLevelId === 999) {
          setGameState(prev => ({ ...prev, status: 'EDITOR' }));
      } else {
          setGameState({
            currentLevelId: 1,
            status: 'MENU',
            health: 1,
            weapon: null,
            ammo: GAME_DATA.player.combat.defaultAmmo,
            activeInfo: null,
            hasKey: false
          });
          setCustomLevelData(undefined);
          setEditorState(undefined); // Clear editor state on full quit
      }
  };

  const handleInfoTrigger = (text: string | null) => {
      setGameState(prev => {
          if (prev.activeInfo === text) return prev;
          return { ...prev, activeInfo: text };
      });
  }

  const handleAmmoConsumed = () => {
      setGameState(prev => ({
          ...prev,
          ammo: Math.max(0, prev.ammo - 1)
      }));
  };

  const handleKeyCollected = () => {
      setGameState(prev => ({ ...prev, hasKey: true }));
  };

  // Touch Input Handlers
  const handleInputStart = (input: string) => {
      setActiveInputs(prev => new Set(prev).add(input));
  };

  const handleInputEnd = (input: string) => {
      setActiveInputs(prev => {
          const next = new Set(prev);
          next.delete(input);
          return next;
      });
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none">
      
      {gameState.status === 'EDITOR' && (
          <MapEditor 
              initialState={editorState} // Pass saved state
              onBack={() => { setGameState({ ...gameState, status: 'MENU' }); }} 
              onPlay={startTestLevel} 
          />
      )}

      {/* Main Menu Extra Button */}
      {gameState.status === 'MENU' && (
           <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[100]">
               <div className="absolute top-0 left-0 w-full h-2 bg-white opacity-20"></div>
               <div className="absolute bottom-0 left-0 w-full h-2 bg-white opacity-20"></div>
               
               <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-widest text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] text-center px-4">
                   A SQUARE'S LIFE
               </h1>
               
               <div className="flex flex-col gap-2 mb-12 text-center">
                   <p className="text-gray-300 font-bold font-mono text-xs max-w-md leading-relaxed drop-shadow-md">
                       CHAPTER 1: THE SHADOWS
                   </p>
               </div>

               <div className="flex flex-col gap-4 w-64">
                    <button 
                        onClick={startGame}
                        className="px-8 py-4 border-4 border-white text-xl text-white font-black hover:bg-white hover:text-black transition-all duration-300 font-mono tracking-widest drop-shadow-lg uppercase text-center"
                    >
                        Initialize
                    </button>
                    <button 
                        onClick={startEditor}
                        className="px-6 py-3 border-2 border-gray-500 text-gray-400 font-bold hover:border-white hover:text-white transition-all font-mono tracking-widest text-sm uppercase text-center"
                    >
                        Map Editor
                    </button>
               </div>

               <div className="mt-16 text-xs text-gray-500 font-mono">
                   MOBILE & DESKTOP COMPATIBLE
               </div>
           </div>
      )}

      {/* Game Layer */}
      {(gameState.status === 'PLAYING' || gameState.status === 'PAUSED' || gameState.status === 'DIED' || gameState.status === 'VICTORY') && (
        <>
            <GameCanvas 
              key={gameKey} 
              currentLevelId={gameState.currentLevelId}
              levelDataOverride={customLevelData}
              isPaused={gameState.status === 'PAUSED'}
              activeInputs={activeInputs}
              currentAmmo={gameState.ammo}
              hasKey={gameState.hasKey}
              onLevelComplete={handleLevelComplete}
              onPlayerDeath={handlePlayerDeath}
              onInfoTrigger={handleInfoTrigger}
              onAmmoConsumed={handleAmmoConsumed}
              onKeyCollected={handleKeyCollected}
            />

            <UIOverlay 
                gameState={gameState}
                levelName={currentLevelConfig?.name || "Unknown"}
                onStart={startGame}
                onRestart={handleRestartLevel}
                onPauseToggle={togglePause}
                onQuit={handleQuitToMenu}
                activeInputs={activeInputs}
                onInputStart={handleInputStart}
                onInputEnd={handleInputEnd}
            />
        </>
      )}
      
      {/* Level Transition Overlay */}
      <div 
        className={`absolute inset-0 bg-black pointer-events-none z-50 transition-opacity duration-500 ease-in-out ${
            transitionState === 'IDLE' ? 'opacity-0' : 
            transitionState === 'FADE_OUT' ? 'opacity-100' : 'opacity-0'
        }`}
      ></div>

    </div>
  );
}