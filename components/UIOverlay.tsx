import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '../types';

interface UIOverlayProps {
    gameState: GameState;
    levelName: string;
    onStart: () => void;
    onRestart: () => void;
    onPauseToggle: () => void;
    onQuit: () => void;
    activeInputs: Set<string>;
    onInputStart: (input: string) => void;
    onInputEnd: (input: string) => void;
    onSettings: () => void;
}

const ArrowLeftIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M14 7l-5 5 5 5V7z" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M10 17l5-5-5-5v10z" />
    </svg>
);

const JumpIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12 4l-8 8h6v8h4v-8h6z" />
    </svg>
);

const FireIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <circle cx="12" cy="12" r="3" fill="currentColor" />
    </svg>
);

const KeyIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M21 10h-8.35A5.99 5.99 0 0 0 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6a5.99 5.99 0 0 0 5.65-4H17v4h4v-4h2v-4zM7 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3-3 3z"/>
    </svg>
);

const SettingsIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
        <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.488.488 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.04.17 0 .36.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.04-.22 0-.45-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
    </svg>
);

interface TouchButtonProps {
    action: string;
    children: React.ReactNode;
    className?: string;
    sizeClass?: string;
    isActive: boolean;
    onInputStart: (input: string) => void;
    onInputEnd: (input: string) => void;
    resetInactivityTimer: () => void;
}

const TouchButton: React.FC<TouchButtonProps> = ({ 
    action, 
    children, 
    className, 
    sizeClass = "w-16 h-16",
    isActive,
    onInputStart,
    onInputEnd,
    resetInactivityTimer
}) => {
    return (
        <button
            className={`
                flex items-center justify-center 
                backdrop-blur-md transition-all duration-200 
                border border-white/30 shadow-lg
                ${sizeClass}
                ${className} 
                ${isActive 
                    ? 'bg-white text-black scale-95 shadow-inner' 
                    : 'bg-black/20 text-white hover:bg-white/10 active:scale-95'
                }
            `}
            onPointerDown={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                    e.currentTarget.releasePointerCapture(e.pointerId);
                }
                resetInactivityTimer(); 
                onInputStart(action); 
            }}
            onPointerUp={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                onInputEnd(action); 
            }}
            onPointerLeave={(e) => { 
                e.preventDefault(); 
                e.stopPropagation();
                onInputEnd(action); 
            }}
            onPointerEnter={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (e.buttons > 0) {
                    resetInactivityTimer();
                    onInputStart(action);
                }
            }}
            onContextMenu={(e) => e.preventDefault()}
            style={{ 
                touchAction: 'none',
                WebkitTapHighlightColor: 'transparent'
            }}
        >
            {children}
        </button>
    );
};

export const UIOverlay: React.FC<UIOverlayProps> = ({ 
    gameState, 
    levelName, 
    onStart, 
    onRestart, 
    onPauseToggle, 
    onQuit,
    activeInputs,
    onInputStart,
    onInputEnd,
    onSettings
}) => {
    
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [controlsOpacity, setControlsOpacity] = useState(1);
    
    // INFO TEXT PERSISTENCE LOGIC
    const [displayedText, setDisplayedText] = useState<string>("");
    
    useEffect(() => {
        if (gameState.activeInfo) {
            setDisplayedText(gameState.activeInfo);
        }
    }, [gameState.activeInfo]);

    const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const checkTouch = () => {
            const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isSmallScreen = window.innerWidth < 1024;
            setIsTouchDevice(hasTouch || isSmallScreen);
        };
        checkTouch();
        window.addEventListener('resize', checkTouch);
        return () => window.removeEventListener('resize', checkTouch);
    }, []);

    const resetInactivityTimer = () => {
        setControlsOpacity(1);
        if (inactivityTimer.current) {
            clearTimeout(inactivityTimer.current);
        }
        inactivityTimer.current = setTimeout(() => {
            setControlsOpacity(0.3);
        }, 2500);
    };

    useEffect(() => {
        if (isTouchDevice && gameState.status === 'PLAYING') {
            resetInactivityTimer();
        }
        return () => {
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [isTouchDevice, gameState.status]);

    // MENU is now handled in App.tsx to support custom buttons, removing duplicates here
    if (gameState.status === 'MENU') return null;

    const isTestLevel = gameState.currentLevelId === 999;
    const quitLabel = isTestLevel ? "Back to Editor" : "Quit to Menu";

    if (gameState.status === 'PAUSED') {
         return (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100] animate-fade-slide-down">
                <h2 className="text-3xl text-white font-black tracking-widest mb-10 border-b-2 border-white pb-4">
                    SYSTEM PAUSED
                </h2>
                
                <div className="flex flex-col gap-6 w-64">
                    <button 
                        onClick={onPauseToggle}
                        className="py-3 border-2 border-white text-white font-bold hover:bg-white hover:text-black transition-all uppercase tracking-wider text-sm"
                    >
                        Resume
                    </button>
                    <button 
                        onClick={onSettings}
                        className="py-3 border-2 border-gray-400 text-gray-400 font-bold hover:border-white hover:text-white transition-all uppercase tracking-wider text-sm"
                    >
                        Settings
                    </button>
                    <button 
                        onClick={onRestart}
                        className="py-3 border-2 border-gray-400 text-gray-400 font-bold hover:border-white hover:text-white transition-all uppercase tracking-wider text-sm"
                    >
                        Restart Level
                    </button>
                    <button 
                        onClick={onQuit}
                        className="py-3 border-2 border-red-900 text-red-500 font-bold hover:border-red-500 hover:bg-red-900/50 transition-all uppercase tracking-wider text-sm"
                    >
                        {quitLabel}
                    </button>
                </div>
            </div>
        );
    }

    if (gameState.status === 'DIED') {
        return (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-[100]">
                <div className="absolute inset-0 bg-black opacity-90"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <h2 className="text-2xl md:text-3xl text-white mb-8 font-black tracking-[0.4em] uppercase drop-shadow-[0_0_15px_rgba(255,0,0,0.5)] shadow-white text-center">
                        Sequence Terminated
                    </h2>
                    <div className="flex gap-4">
                        <button 
                            onClick={onRestart}
                            className="px-8 py-3 border-2 border-white text-white font-bold tracking-widest hover:bg-white hover:text-black transition-all duration-300 drop-shadow-lg text-sm"
                        >
                            RETRY
                        </button>
                        <button 
                            onClick={onQuit}
                            className="px-8 py-3 border-2 border-gray-500 text-gray-500 font-bold tracking-widest hover:border-white hover:text-white transition-all duration-300 text-sm"
                        >
                            {isTestLevel ? "EDITOR" : "QUIT"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState.status === 'VICTORY') {
        return (
            <div className="absolute inset-0 bg-white flex flex-col items-center justify-center z-[100] animate-pulse">
                {isTestLevel ? (
                    <>
                        <h1 className="text-4xl text-black font-black mb-4 drop-shadow-xl text-center">TEST COMPLETE</h1>
                        <button 
                            onClick={onQuit}
                            className="mt-8 px-6 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
                        >
                            BACK TO EDITOR
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-4xl md:text-6xl text-black font-black mb-4 drop-shadow-xl text-center">THE SQUARE SURVIVES</h1>
                        <p className="text-black font-bold font-mono text-lg">End of Prototype</p>
                        <button 
                            onClick={onQuit}
                            className="mt-8 px-6 py-2 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors"
                        >
                            RETURN
                        </button>
                    </>
                )}
            </div>
        );
    }

    return (
        <>
            <div className="absolute top-0 left-0 w-full p-2 md:p-6 flex justify-between items-start pointer-events-none z-[60]">
                <div className="flex flex-col">
                    <span className="text-[10px] text-gray-600 font-bold tracking-widest uppercase mb-1 drop-shadow-sm">Level {gameState.currentLevelId}</span>
                    <span className="text-xl md:text-2xl font-black text-black tracking-wider drop-shadow-[0_2px_0_rgba(255,255,255,1)]">{levelName}</span>
                </div>
                
                <div className="flex flex-col items-end gap-3">
                    <div className="flex gap-4 items-start">
                        {/* Key Status - Stylized */}
                        {gameState.hasKey && (
                            <div className="flex items-center gap-2 border-2 border-black bg-white px-2 py-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                                <KeyIcon />
                                <span className="text-xs font-black text-black uppercase tracking-widest font-mono hidden md:inline">KEY ACQUIRED</span>
                            </div>
                        )}

                         <button 
                            onClick={onSettings}
                            className="pointer-events-auto p-2 px-3 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors bg-white/50 backdrop-blur-sm shadow-md"
                            aria-label="Settings"
                        >
                            <SettingsIcon />
                        </button>

                        <button 
                            onClick={onPauseToggle} 
                            className="pointer-events-auto p-2 px-3 border-2 border-black text-black font-bold hover:bg-black hover:text-white transition-colors bg-white/50 backdrop-blur-sm shadow-md"
                            aria-label="Pause"
                        >
                            ||
                        </button>
                    </div>

                    {/* Weapon Status */}
                    {gameState.weapon && (
                        <div className="flex flex-col items-end">
                            <div className="flex items-center gap-2 mt-1">
                                <div className="w-2 h-2 bg-black animate-pulse"></div>
                                <span className="text-[10px] font-bold font-mono text-black tracking-wider uppercase hidden md:inline">ARMED</span>
                            </div>
                            <div className="mt-1 font-mono font-bold text-base md:text-lg drop-shadow-sm">
                                <span className={gameState.ammo === 0 ? "text-red-600" : gameState.ammo < 5 ? "text-orange-600" : "text-black"}>
                                    AMMO: {gameState.ammo}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* INFO TEXT - Moved to TOP and made smaller */}
            <div 
                className={`absolute top-12 w-full text-center pointer-events-none z-[60] transition-all duration-700 transform ${
                    gameState.activeInfo ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                }`}
            >
                <div className="inline-block bg-black/70 text-white px-4 py-1.5 rounded-sm backdrop-blur-md mx-4">
                    <p className="text-sm md:text-base font-bold tracking-wider font-mono uppercase">
                        {displayedText}
                    </p>
                </div>
            </div>

            {isTouchDevice && (
                <div 
                    className="absolute inset-0 pointer-events-none z-[70] transition-opacity duration-500 ease-in-out"
                    style={{ opacity: controlsOpacity }}
                >
                    <div className="absolute bottom-6 left-6 flex gap-3 pointer-events-auto">
                        <TouchButton 
                            action="LEFT" 
                            className="rounded-l-2xl rounded-r-md"
                            isActive={activeInputs.has('LEFT')}
                            onInputStart={onInputStart}
                            onInputEnd={onInputEnd}
                            resetInactivityTimer={resetInactivityTimer}
                        >
                            <ArrowLeftIcon />
                        </TouchButton>
                        <TouchButton 
                            action="RIGHT" 
                            className="rounded-r-2xl rounded-l-md"
                            isActive={activeInputs.has('RIGHT')}
                            onInputStart={onInputStart}
                            onInputEnd={onInputEnd}
                            resetInactivityTimer={resetInactivityTimer}
                        >
                            <ArrowRightIcon />
                        </TouchButton>
                    </div>

                    <div className="absolute bottom-6 right-6 pointer-events-auto">
                        <div className="relative w-32 h-32">
                             {gameState.weapon && (
                                <div className="absolute top-0 left-0 transform -translate-x-2 -translate-y-2">
                                    <TouchButton 
                                        action="FIRE" 
                                        sizeClass="w-14 h-14" 
                                        className="rounded-full border-red-500/30 text-red-500 bg-red-900/10 active:bg-red-500 active:text-white"
                                        isActive={activeInputs.has('FIRE')}
                                        onInputStart={onInputStart}
                                        onInputEnd={onInputEnd}
                                        resetInactivityTimer={resetInactivityTimer}
                                    >
                                        <FireIcon />
                                    </TouchButton>
                                </div>
                            )}

                            <div className="absolute bottom-0 right-0">
                                <TouchButton 
                                    action="JUMP" 
                                    sizeClass="w-20 h-20" 
                                    className="rounded-2xl"
                                    isActive={activeInputs.has('JUMP')}
                                    onInputStart={onInputStart}
                                    onInputEnd={onInputEnd}
                                    resetInactivityTimer={resetInactivityTimer}
                                >
                                    <JumpIcon />
                                </TouchButton>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};