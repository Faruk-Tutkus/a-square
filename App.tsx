import React, { useState, useEffect } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIOverlay } from './components/UIOverlay';
import { MapEditor, EditorCampaignState } from './components/MapEditor'; 
import { GAME_DATA } from './constants';
import { GameState, LevelConfig } from './types';
import { AudioEngine } from './audio';

export default function App() {
  const [gameState, setGameState] = useState<GameState>({
    currentLevelId: 0,
    status: 'MENU',
    health: GAME_DATA.player.health.max,
    weapon: null,
    ammo: GAME_DATA.player.combat.defaultAmmo,
    activeInfo: null,
    hasKey: false,
    maxUnlockedLevel: 0
  });

  const [gameKey, setGameKey] = useState(0);
  const [transitionState, setTransitionState] = useState<'IDLE' | 'FADE_OUT' | 'FADE_IN'>('IDLE');
  const [customLevelData, setCustomLevelData] = useState<LevelConfig | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [audioSettings, setAudioSettings] = useState({ music: 0.25, sfx: 0.30 }); // Match audio.ts defaults
  
  // Store editor state to resume later
  const [editorState, setEditorState] = useState<EditorCampaignState | undefined>(undefined);
  
  // Track inputs for touch controls
  const [activeInputs, setActiveInputs] = useState<Set<string>>(new Set());

  // Determine current level config (custom or built-in)
  const currentLevelConfig = customLevelData || GAME_DATA.levels.find(l => l.id === gameState.currentLevelId);

  // Initialize Audio Logic
  useEffect(() => {
     // Initial init attempt
     AudioEngine.init();

     // Add global listener to start music on ANY interaction (required for browser policy)
     const handleUserInteraction = () => {
         AudioEngine.init();
         AudioEngine.resume();
         AudioEngine.startMusic();
         
         // Remove listeners once activated
         window.removeEventListener('click', handleUserInteraction);
         window.removeEventListener('keydown', handleUserInteraction);
         window.removeEventListener('touchstart', handleUserInteraction);
     };

     window.addEventListener('click', handleUserInteraction);
     window.addEventListener('keydown', handleUserInteraction);
     window.addEventListener('touchstart', handleUserInteraction);

     return () => {
         window.removeEventListener('click', handleUserInteraction);
         window.removeEventListener('keydown', handleUserInteraction);
         window.removeEventListener('touchstart', handleUserInteraction);
     };
  }, []);

  // Keyboard Pause Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'Escape') {
            if (showSettings) {
                setShowSettings(false);
                return;
            }

            if (gameState.status === 'PLAYING') {
                setGameState(prev => ({ ...prev, status: 'PAUSED' }));
            } else if (gameState.status === 'PAUSED') {
                setGameState(prev => ({ ...prev, status: 'PLAYING' }));
            } else if (gameState.status === 'LEVEL_SELECT') {
                setGameState(prev => ({ ...prev, status: 'MENU' }));
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.status, showSettings]);

  const updateVolume = (type: 'music' | 'sfx', val: number) => {
      const newSettings = { ...audioSettings, [type]: val };
      setAudioSettings(newSettings);
      AudioEngine.setVolumes(newSettings.music, newSettings.sfx);
  };

  const startGame = () => {
    // Just in case it hasn't started yet
    AudioEngine.init();
    AudioEngine.resume();
    AudioEngine.startMusic();
    loadLevel(0);
  };

  const loadLevel = (levelId: number) => {
    setCustomLevelData(undefined);
    setGameState(prev => ({
      ...prev,
      status: 'PLAYING',
      currentLevelId: levelId,
      health: 1,
      weapon: null, 
      ammo: GAME_DATA.player.combat.defaultAmmo,
      activeInfo: null,
      hasKey: false
    }));
    setGameKey(prev => prev + 1);
  };

  const startEditor = () => {
    AudioEngine.init();
    setGameState(prev => ({ ...prev, status: 'EDITOR' }));
  };

  const openLevelSelect = () => {
    AudioEngine.init();
    setGameState(prev => ({ ...prev, status: 'LEVEL_SELECT' }));
  };

  // Called from Editor to playtest
  const startTestLevel = (levelData: LevelConfig, currentEditorState: EditorCampaignState) => {
      setCustomLevelData(levelData);
      setEditorState(currentEditorState); // Persist editor state
      setGameState(prev => ({
          ...prev,
          currentLevelId: 999, // ID used for custom levels
          status: 'PLAYING',
          health: 1,
          weapon: 'light_gun',
          ammo: 999,
          activeInfo: "Testing Custom Level",
          hasKey: false
      }));
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
    AudioEngine.playSound('portal');
    
    setTimeout(() => {
        // Custom Level Handling
        if (gameState.currentLevelId === 999) {
             setGameState(prev => ({ ...prev, status: 'VICTORY' }));
             setTransitionState('IDLE');
             return;
        }

        const nextLevel = GAME_DATA.levels.find(l => l.id === nextLevelId);
        
        // Loop check (specific to original request)
        if (nextLevelId === 1 && gameState.currentLevelId === 6) {
            setGameState(prev => ({ ...prev, status: 'VICTORY' }));
            setTransitionState('IDLE');
            return;
        }

        if (nextLevel) {
            // Update Progression
            const newMaxUnlocked = Math.max(gameState.maxUnlockedLevel, nextLevelId);
            
            setGameState(prev => ({
                ...prev,
                status: 'INTERMISSION',
                maxUnlockedLevel: newMaxUnlocked,
                // We prepare the ID for the intermission screen to know what's next
                currentLevelId: nextLevelId 
            }));
            
            setTransitionState('IDLE'); // Fade in happens on Intermission screen render
        } else {
            // No next level found -> Victory
             setGameState(prev => ({ ...prev, status: 'VICTORY' }));
             setTransitionState('IDLE');
        }
    }, 500);
  };

  const handleProceedFromIntermission = () => {
      const nextLevelId = gameState.currentLevelId; // Already set in handleLevelComplete
      const nextLevel = GAME_DATA.levels.find(l => l.id === nextLevelId);
      
      if (nextLevel) {
          setGameState(prev => ({
              ...prev,
              status: 'PLAYING',
              weapon: nextLevel.items?.some(i => i.weapon === 'light_gun') ? 'light_gun' : prev.weapon,
              ammo: nextLevel.items?.some(i => i.weapon === 'light_gun') ? GAME_DATA.player.combat.defaultAmmo : prev.ammo,
              hasKey: false,
              activeInfo: null
          }));
          setGameKey(prev => prev + 1); // Force re-mount of canvas
      }
  };

  const handlePlayerDeath = () => {
    setGameState(prev => ({ ...prev, status: 'DIED' }));
    AudioEngine.playSound('player_die');
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
          setGameState(prev => ({
            ...prev,
            status: 'MENU',
            currentLevelId: 0,
            activeInfo: null,
            hasKey: false
          }));
          setCustomLevelData(undefined);
          setEditorState(undefined); // Clear editor state on full quit
          // We don't stop music anymore, keeps playing in menu
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
      AudioEngine.playSound('key');
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
    <div className="relative w-full h-screen overflow-hidden bg-black select-none font-mono">
      
      {gameState.status === 'EDITOR' && (
          <MapEditor 
              initialState={editorState} // Pass saved state
              onBack={() => { setGameState(prev => ({ ...prev, status: 'MENU' })); }} 
              onPlay={startTestLevel} 
          />
      )}

      {/* ──────────────── MAIN MENU ──────────────── */}
      {gameState.status === 'MENU' && !showSettings && (
           <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[100] p-8 md:p-0">
               <div className="absolute top-0 left-0 w-full h-2 bg-white opacity-20"></div>
               <div className="absolute bottom-0 left-0 w-full h-2 bg-white opacity-20"></div>
               
               <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-6 md:mb-8 tracking-widest text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.6)] text-center px-2">
                   A SQUARE'S LIFE
               </h1>
               
               <div className="flex flex-col gap-2 mb-8 md:mb-12 text-center">
                   <p className="text-gray-300 font-bold text-[10px] md:text-xs max-w-md leading-relaxed drop-shadow-md tracking-widest">
                       CHAPTER 1: THE SHADOWS
                   </p>
               </div>

               <div className="flex flex-col gap-3 md:gap-4 w-full max-w-[280px]">
                    <button 
                        onClick={startGame}
                        className="px-6 py-3 md:px-8 md:py-4 border-4 border-white text-lg md:text-xl text-white font-black hover:bg-white hover:text-black transition-all duration-300 tracking-widest drop-shadow-lg uppercase text-center"
                    >
                        Initialize
                    </button>
                    <button 
                        onClick={openLevelSelect}
                        className="px-4 py-3 md:px-6 md:py-3 border-2 border-gray-500 text-gray-300 font-bold hover:border-white hover:text-white transition-all tracking-widest text-xs md:text-sm uppercase text-center"
                    >
                        Levels
                    </button>
                    <div className="flex gap-2">
                        <button 
                            onClick={startEditor}
                            className="flex-1 px-4 py-3 border-2 border-gray-700 text-gray-500 font-bold hover:border-gray-400 hover:text-gray-300 transition-all tracking-widest text-[10px] md:text-xs uppercase text-center"
                        >
                            Map Editor
                        </button>
                        <button 
                            onClick={() => setShowSettings(true)}
                            className="w-12 border-2 border-gray-700 text-gray-500 flex items-center justify-center hover:border-gray-400 hover:text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.04.17 0 .36.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.04-.22 0-.45-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                            </svg>
                        </button>
                    </div>
               </div>

               <div className="mt-12 md:mt-16 text-[10px] md:text-xs text-gray-600">
                   BUILD {GAME_DATA.meta.build}
               </div>
           </div>
      )}

      {/* ──────────────── SETTINGS OVERLAY ──────────────── */}
      {showSettings && (
           <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center z-[200] p-8">
               <h2 className="text-3xl text-white font-black tracking-widest mb-10 border-b-2 border-white pb-4">
                  SETTINGS
               </h2>
               
               <div className="flex flex-col gap-8 w-64 md:w-80">
                   <div className="flex flex-col gap-2">
                       <div className="flex justify-between text-gray-400 text-xs font-bold uppercase">
                           <span>Music Volume</span>
                           <span>{Math.round(audioSettings.music * 100)}%</span>
                       </div>
                       <input 
                           type="range" 
                           min="0" max="1" step="0.05"
                           value={audioSettings.music}
                           onChange={(e) => updateVolume('music', parseFloat(e.target.value))}
                           className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                       />
                   </div>

                   <div className="flex flex-col gap-2">
                       <div className="flex justify-between text-gray-400 text-xs font-bold uppercase">
                           <span>SFX Volume</span>
                           <span>{Math.round(audioSettings.sfx * 100)}%</span>
                       </div>
                       <input 
                           type="range" 
                           min="0" max="1" step="0.05"
                           value={audioSettings.sfx}
                           onChange={(e) => updateVolume('sfx', parseFloat(e.target.value))}
                           className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                       />
                   </div>

                   <button 
                       onClick={() => setShowSettings(false)}
                       className="mt-6 py-3 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all uppercase tracking-wider text-sm"
                   >
                       Return
                   </button>
               </div>
           </div>
      )}

      {/* ──────────────── LEVEL SELECT SCREEN ──────────────── */}
      {gameState.status === 'LEVEL_SELECT' && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[100] p-6 animate-fade-slide-down">
              <h2 className="text-2xl md:text-3xl text-white font-black tracking-[0.3em] mb-10 border-b-2 border-white pb-4 text-center">
                  SELECT SEQUENCE
              </h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full max-h-[60vh] overflow-y-auto p-2">
                  {GAME_DATA.levels.map((level, index) => {
                      const isLocked = index > gameState.maxUnlockedLevel;
                      return (
                          <button
                              key={level.id}
                              disabled={isLocked}
                              onClick={() => loadLevel(level.id)}
                              className={`
                                  relative p-4 border-2 transition-all duration-300 flex flex-col gap-2 h-28 md:h-32 justify-between group
                                  ${isLocked 
                                      ? 'border-gray-800 bg-gray-900/50 cursor-not-allowed opacity-50' 
                                      : 'border-gray-500 bg-black hover:bg-white hover:border-white cursor-pointer'
                                  }
                              `}
                          >
                              <div className="flex justify-between w-full">
                                  <span className={`text-lg md:text-xl font-bold ${isLocked ? 'text-gray-700' : 'text-gray-400 group-hover:text-black'}`}>
                                      {String(index).padStart(2, '0')}
                                  </span>
                                  {isLocked && (
                                      <svg className="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                      </svg>
                                  )}
                              </div>
                              <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider text-left ${isLocked ? 'text-gray-800' : 'text-gray-300 group-hover:text-black'}`}>
                                  {level.name}
                              </span>
                          </button>
                      );
                  })}
              </div>

              <button 
                  onClick={() => setGameState(prev => ({ ...prev, status: 'MENU' }))}
                  className="mt-10 px-6 py-3 border-2 border-gray-600 text-gray-500 font-bold hover:border-white hover:text-white transition-all tracking-widest text-xs md:text-sm uppercase"
              >
                  Return to Menu
              </button>
          </div>
      )}

      {/* ──────────────── INTERMISSION SCREEN ──────────────── */}
      {gameState.status === 'INTERMISSION' && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center z-[100] animate-fade-slide-down p-6">
              <div className="border-t-2 border-b-2 border-white/20 py-8 px-6 w-full max-w-2xl flex flex-col items-center bg-zinc-900/20 backdrop-blur-sm">
                  <span className="text-gray-500 tracking-[0.5em] text-[10px] md:text-xs font-bold mb-4 uppercase text-center">
                      Sequence Complete
                  </span>
                  
                  {/* Find previous level name for display */}
                  <h2 className="text-2xl md:text-4xl text-white font-black tracking-widest mb-2 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                      {GAME_DATA.levels.find(l => l.id === gameState.currentLevelId)?.name || "UNKNOWN"}
                  </h2>
                  
                  <div className="w-16 h-1 bg-white my-6"></div>

                  <p className="text-gray-400 font-mono text-xs md:text-sm max-w-md text-center leading-relaxed">
                      Systems stabilizing. Proceed to next sector.
                  </p>
              </div>

              <div className="mt-8 md:mt-12 flex flex-col gap-3 w-full max-w-xs">
                  <button 
                      onClick={handleProceedFromIntermission}
                      className="w-full py-4 bg-white text-black text-sm md:text-base font-black tracking-[0.2em] hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] uppercase text-center"
                  >
                      Initiate Next
                  </button>
                  <button 
                      onClick={handleQuitToMenu}
                      className="w-full py-2 text-gray-600 font-bold hover:text-white transition-colors tracking-widest text-[10px] md:text-xs uppercase text-center"
                  >
                      Return to Menu
                  </button>
              </div>
          </div>
      )}

      {/* ──────────────── GAME LAYER ──────────────── */}
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
                onSettings={() => setShowSettings(true)}
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