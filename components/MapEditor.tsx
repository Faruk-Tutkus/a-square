import React, { useState, useRef, useEffect } from 'react';
import { LevelConfig, GameConfig, EnemyConfig } from '../types';
import { GAME_DATA } from '../constants';

// Represents the state of a SINGLE level in the editor
export interface EditorLevelState {
    internalId: string; // Unique ID for editor list handling
    objects: EditorObject[];
    mapSize: { w: number, h: number };
    levelName: string;
    gameLevelId: number; // The actual ID used in game logic
}

// Represents the state of the ENTIRE editor session (all levels)
export interface EditorCampaignState {
    levels: EditorLevelState[];
    activeIndex: number;
}

interface MapEditorProps {
    initialState?: EditorCampaignState; // Changed from EditorState
    onBack: () => void;
    onPlay: (levelData: LevelConfig, editorState: EditorCampaignState) => void;
}

// Editor-specific types
export type EditorObjectType = 'platform' | 'enemy' | 'box' | 'button' | 'door' | 'key' | 'exit' | 'start' | 'info';

export interface EditorObject {
    id: string;
    type: EditorObjectType;
    x: number; // in grid units (32px)
    y: number; // in grid units (32px)
    // Dynamic props based on type
    w?: number; // width for platform or info
    h?: number; // height for door OR platform
    subType?: string; // enemy type name
    linkTo?: string; // for button -> door
    linkId?: string; // for door/button ID
    hp?: number; // enemy HP
    speed?: number; // enemy Speed
    behavior?: 'hold' | 'once'; // button behavior
    text?: string; // info point text
}

const TILE_SIZE = 32;

// --- PARSER UTILITIES (LevelConfig -> EditorLevelState) ---
const getNextId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random()*10000)}`;

const parseLevelToEditorState = (level: LevelConfig): EditorLevelState => {
    const objects: EditorObject[] = [];

    // Platforms
    level.map.platforms.forEach(p => {
        objects.push({
            id: getNextId('plat'),
            type: 'platform',
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h || 1
        });
    });

    // Enemies
    if (level.enemies) {
        level.enemies.forEach(e => {
            objects.push({
                id: getNextId('enemy'),
                type: 'enemy',
                x: e.x,
                y: e.y !== undefined ? e.y : 0, 
                subType: e.type,
                hp: e.hp,
                speed: e.speed
            });
        });
    }

    // Boxes
    if (level.boxes) {
        level.boxes.forEach(b => {
            objects.push({ id: getNextId('box'), type: 'box', x: b.x, y: b.y });
        });
    }

    // Doors
    if (level.doors) {
        level.doors.forEach(d => {
            objects.push({
                id: getNextId('door'),
                type: 'door',
                x: d.x,
                y: d.y,
                h: d.h,
                linkId: d.id
            });
        });
    }

    // Buttons
    if (level.buttons) {
        level.buttons.forEach(b => {
            objects.push({
                id: getNextId('btn'),
                type: 'button',
                x: b.x,
                y: b.y,
                linkId: b.id,
                linkTo: b.linkToDoorId,
                behavior: b.behavior
            });
        });
    }

    // Info Points
    if (level.infoPoints) {
        level.infoPoints.forEach(i => {
            objects.push({
                id: getNextId('info'),
                type: 'info',
                x: i.x,
                y: 10, // Default Y
                w: i.w,
                text: i.text
            });
        });
    }

    // Key
    if (level.hasKey && level.keyPos) {
        objects.push({
            id: getNextId('key'),
            type: 'key',
            x: level.keyPos.x,
            y: level.keyPos.y
        });
    }

    // Start (Checkpoint)
    if (level.checkpoints && level.checkpoints.length > 0) {
        objects.push({
            id: getNextId('start'),
            type: 'start',
            x: level.checkpoints[0].x,
            y: level.checkpoints[0].y
        });
    } else {
         objects.push({ id: getNextId('start'), type: 'start', x: 2, y: 10 });
    }

    // Exit
    if (level.portalPos) {
        objects.push({
            id: getNextId('exit'),
            type: 'exit',
            x: level.portalPos.x,
            y: level.portalPos.y
        });
    }

    return {
        internalId: getNextId('level_state'),
        gameLevelId: level.id,
        levelName: level.name,
        mapSize: level.map.size,
        objects: objects
    };
};


export const MapEditor: React.FC<MapEditorProps> = ({ initialState, onBack, onPlay }) => {
    
    // --- STATE MANAGEMENT ---
    // Initialize campaign with existing GAME_DATA levels or persisted state
    const [campaignLevels, setCampaignLevels] = useState<EditorLevelState[]>(() => {
        if (initialState && initialState.levels.length > 0) {
            return initialState.levels;
        }
        
        // Import existing levels if no state provided
        if (GAME_DATA.levels.length > 0) {
            return GAME_DATA.levels.map(parseLevelToEditorState);
        }
        
        // Fallback default
        return [{
            internalId: 'default_1',
            gameLevelId: 0,
            levelName: 'New Level',
            mapSize: { w: 60, h: 25 },
            objects: [{ id: 'start_1', type: 'start', x: 5, y: 10 }]
        }];
    });

    const [currentLevelIndex, setCurrentLevelIndex] = useState(initialState?.activeIndex || 0);

    // Current Working State (decoupled from array for performance)
    const [mapSize, setMapSize] = useState(campaignLevels[currentLevelIndex].mapSize);
    const [objects, setObjects] = useState<EditorObject[]>(campaignLevels[currentLevelIndex].objects);
    const [levelName, setLevelName] = useState(campaignLevels[currentLevelIndex].levelName);
    const [gameLevelId, setGameLevelId] = useState(campaignLevels[currentLevelIndex].gameLevelId);

    // Undo History (Local to current level)
    const [history, setHistory] = useState<EditorObject[][]>([]);
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<EditorObjectType | null>(null);
    const [toolSubType, setToolSubType] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    
    const canvasRef = useRef<HTMLDivElement>(null);

    // Sync Helper: Saves current workspace to the campaign array
    const saveWorkspaceToCampaign = () => {
        setCampaignLevels(prev => {
            const newLevels = [...prev];
            newLevels[currentLevelIndex] = {
                ...newLevels[currentLevelIndex],
                objects,
                mapSize,
                levelName,
                gameLevelId
            };
            return newLevels;
        });
    };

    // Switch Level Handler
    const handleSwitchLevel = (index: number) => {
        if (index === currentLevelIndex) return;
        
        // Save current level state to array
        setCampaignLevels(prev => {
            const newLevels = [...prev];
            newLevels[currentLevelIndex] = {
                ...newLevels[currentLevelIndex],
                objects,
                mapSize,
                levelName,
                gameLevelId
            };
            return newLevels;
        });
        
        // Load target level state
        const target = campaignLevels[index]; 
        
        // Note: In strict mode, campaignLevels might not be updated immediately in this scope if we relied on the setter above.
        // However, we are reading from 'campaignLevels' which is the render-cycle state.
        // To be perfectly safe, we should assume the 'objects' state variable holds the latest edits for the *current* level index.
        
        setObjects(target.objects);
        setMapSize(target.mapSize);
        setLevelName(target.levelName);
        setGameLevelId(target.gameLevelId);
        setHistory([]); // Clear history on switch
        setSelectedId(null);
        setCurrentLevelIndex(index);
    };

    const handleAddLevel = () => {
        // Save current level first
        const currentLevelState: EditorLevelState = {
            ...campaignLevels[currentLevelIndex],
            objects,
            mapSize,
            levelName,
            gameLevelId
        };
        
        const newId = campaignLevels.length;
        const newLevel: EditorLevelState = {
            internalId: getNextId('lvl'),
            gameLevelId: newId,
            levelName: `Level ${newId}`,
            mapSize: { w: 60, h: 25 },
            objects: [{ id: getNextId('start'), type: 'start', x: 5, y: 10 }]
        };

        const updatedCampaign = [...campaignLevels];
        updatedCampaign[currentLevelIndex] = currentLevelState;
        updatedCampaign.push(newLevel);

        setCampaignLevels(updatedCampaign);

        // Switch to new level
        const nextIndex = updatedCampaign.length - 1; 
        setObjects(newLevel.objects);
        setMapSize(newLevel.mapSize);
        setLevelName(newLevel.levelName);
        setGameLevelId(newLevel.gameLevelId);
        setHistory([]);
        setSelectedId(null);
        setCurrentLevelIndex(nextIndex);
    };

    const handleDeleteLevel = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (campaignLevels.length <= 1) {
            alert("Cannot delete the last level.");
            return;
        }
        
        const confirmDelete = window.confirm(`Delete Level ${index}: ${campaignLevels[index].levelName}?`);
        if (!confirmDelete) return;

        // Logic to handle deletion
        // If we delete a level before current, decrement current index
        // If we delete current, switch to neighbor
        
        const isDeletingCurrent = index === currentLevelIndex;
        
        const remainingLevels = campaignLevels.filter((_, i) => i !== index);
        
        if (isDeletingCurrent) {
            const newIndex = index > 0 ? index - 1 : 0;
            const target = remainingLevels[newIndex];
            
            setObjects(target.objects);
            setMapSize(target.mapSize);
            setLevelName(target.levelName);
            setGameLevelId(target.gameLevelId);
            setHistory([]);
            setSelectedId(null);
            setCurrentLevelIndex(newIndex);
        } else if (index < currentLevelIndex) {
            setCurrentLevelIndex(prev => prev - 1);
        }

        setCampaignLevels(remainingLevels);
    };

    // KEYBOARD SHORTCUTS
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Undo (Ctrl+Z or Cmd+Z)
            if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
                e.preventDefault();
                undo();
            }
            // Delete
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) {
                    deleteSelected();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedId, history, objects]); 

    const saveHistory = () => {
        setHistory(prev => [...prev, objects]);
    };

    const undo = () => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const previousObjects = prev[prev.length - 1];
            const newHistory = prev.slice(0, prev.length - 1);
            setObjects(previousObjects);
            setSelectedId(null);
            return newHistory;
        });
    };

    const addObject = (x: number, y: number) => {
        if (!activeTool) return;
        saveHistory();

        let initialW = 1;
        let initialH = 1;

        if (activeTool === 'platform') { initialW = 5; initialH = 1; } 
        else if (activeTool === 'door') { initialW = 1; initialH = 3; } 
        else if (activeTool === 'exit') { initialW = 1.5; initialH = 2; } 
        else if (activeTool === 'info') { initialW = 4; initialH = 1; }

        const centerX = x - Math.floor(initialW / 2 + 0.5);
        const centerY = y - Math.floor(initialH / 2 + 0.5);

        const newObj: EditorObject = {
            id: getNextId(activeTool),
            type: activeTool,
            x: centerX,
            y: centerY,
            w: initialW >= 1 ? initialW : undefined,
            h: initialH >= 1 ? initialH : undefined
        };

        if (activeTool === 'enemy') {
            newObj.subType = toolSubType || 'triangle_basic';
            newObj.hp = 1;
            newObj.speed = 100;
        } else if (activeTool === 'door') {
            newObj.linkId = getNextId('door');
        } else if (activeTool === 'button') {
            newObj.linkTo = '';
            newObj.linkId = getNextId('btn');
            newObj.behavior = 'once'; 
        } else if (activeTool === 'exit') {
            newObj.linkTo = String(gameLevelId + 1); // Suggest next level ID
        } else if (activeTool === 'info') {
            newObj.text = "Info text here...";
        }

        setObjects([...objects, newObj]);
        setSelectedId(newObj.id);
    };

    const updateObject = (id: string, updates: Partial<EditorObject>, addToHistory = true) => {
        if (addToHistory) saveHistory();
        setObjects(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    const deleteSelected = () => {
        if (!selectedId) return;
        saveHistory();
        setObjects(prev => prev.filter(o => o.id !== selectedId));
        setSelectedId(null);
    };

    const handleCanvasClick = (e: React.MouseEvent) => {
        if (!isDragging && activeTool && (e.target as HTMLElement).classList.contains('editor-grid')) {
            const rect = canvasRef.current!.getBoundingClientRect();
            const gx = Math.floor((e.clientX - rect.left + canvasRef.current!.scrollLeft) / TILE_SIZE);
            const gy = Math.floor((e.clientY - rect.top + canvasRef.current!.scrollTop) / TILE_SIZE);
            addObject(gx, gy);
        } else if (!activeTool && !isDragging && (e.target as HTMLElement).classList.contains('editor-grid')) {
             setSelectedId(null);
        }
    };

    const handleObjectMouseDown = (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); 
        setSelectedId(id);
        setIsDragging(true);
        saveHistory(); 
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
            const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;
            
            const obj = objects.find(o => o.id === selectedId);
            if (!obj) return;

            const mouseGridX = Math.floor(mouseX / TILE_SIZE);
            const mouseGridY = Math.floor(mouseY / TILE_SIZE);

            const w = obj.w || 1;
            const h = obj.h || 1;

            const targetX = mouseGridX - Math.floor(w / 2 + 0.5);
            const targetY = mouseGridY - Math.floor(h / 2 + 0.5);
            
            const clampedX = Math.max(0, Math.min(targetX, mapSize.w - w));
            const clampedY = Math.max(0, Math.min(targetY, mapSize.h - h));

            updateObject(selectedId, { x: clampedX, y: clampedY }, false);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // --- CONVERSION LOGIC ---
    const generateLevelConfig = (state: EditorLevelState): LevelConfig => {
        const { objects, mapSize, levelName, gameLevelId } = state;

        const platforms = objects.filter(o => o.type === 'platform').map(o => ({ 
            x: o.x, y: o.y, w: o.w || 1, h: o.h || 1 
        }));
        const enemies = objects.filter(o => o.type === 'enemy').map(o => ({ 
            type: o.subType as any, 
            x: o.x,
            y: o.y,
            hp: o.hp,
            speed: o.speed
        }));
        const boxes = objects.filter(o => o.type === 'box').map(o => ({ x: o.x, y: o.y }));
        const doors = objects.filter(o => o.type === 'door').map(o => ({ x: o.x, y: o.y, h: o.h || 3, id: o.linkId || 'door' }));
        const buttons = objects.filter(o => o.type === 'button').map(o => ({ 
            x: o.x, y: o.y, id: o.linkId || 'btn', linkToDoorId: o.linkTo || '', behavior: o.behavior || 'once' 
        }));
        const infoPoints = objects.filter(o => o.type === 'info').map(o => ({
            x: o.x, w: o.w || 4, text: o.text || ''
        }));
        
        const keyObj = objects.find(o => o.type === 'key');
        const startObj = objects.find(o => o.type === 'start') || { x: 5, y: 10 };
        const exitObj = objects.find(o => o.type === 'exit');

        return {
            id: gameLevelId, 
            name: levelName,
            map: {
                size: { w: mapSize.w, h: mapSize.h },
                platforms
            },
            enemies,
            boxes,
            doors,
            buttons,
            infoPoints,
            items: [{ weapon: 'light_gun' }], 
            hasKey: !!keyObj,
            keyPos: keyObj ? { x: keyObj.x, y: keyObj.y } : undefined,
            portalPos: exitObj ? { x: exitObj.x, y: exitObj.y } : undefined,
            checkpoints: [{ x: startObj.x, y: startObj.y }],
            exit: { to: exitObj && exitObj.linkTo ? parseInt(exitObj.linkTo) : gameLevelId + 1 }, 
            ending: undefined
        };
    };

    const handleTestPlay = () => {
        // 1. Create the up-to-date state for the current level being edited
        const currentLevelState: EditorLevelState = { 
            internalId: campaignLevels[currentLevelIndex].internalId, // keep original ID
            gameLevelId, 
            levelName, 
            mapSize, 
            objects 
        };
        
        // 2. Construct the full campaign array with the current level updated
        const updatedCampaign = [...campaignLevels];
        updatedCampaign[currentLevelIndex] = currentLevelState;

        // 3. Create the campaign state object to pass back to App
        const fullCampaignState: EditorCampaignState = {
            levels: updatedCampaign,
            activeIndex: currentLevelIndex
        };

        // 4. Generate the playable config for just this level
        const config = generateLevelConfig(currentLevelState);
        config.id = 999; // Force test ID
        
        // 5. Trigger play
        onPlay(config, fullCampaignState);
    };

    const handleDownloadCampaign = () => {
        // Construct latest state similar to test play
        const currentLevelState: EditorLevelState = { 
            internalId: campaignLevels[currentLevelIndex].internalId,
            gameLevelId, levelName, mapSize, objects 
        };
        
        const updatedCampaign = [...campaignLevels];
        updatedCampaign[currentLevelIndex] = currentLevelState;

        const convertedLevels = updatedCampaign.map(lvl => generateLevelConfig(lvl));
        
        const fullConfig: GameConfig = {
            ...GAME_DATA,
            levels: convertedLevels
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullConfig, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "campaign_export.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Render Logic for Grid Objects
    const renderObject = (obj: EditorObject) => {
        const isSelected = obj.id === selectedId;
        const style: React.CSSProperties = {
            position: 'absolute',
            left: obj.x * TILE_SIZE,
            top: obj.y * TILE_SIZE,
            width: (obj.w || 1) * TILE_SIZE,
            height: (obj.h || 1) * TILE_SIZE,
            border: isSelected ? '2px solid yellow' : '1px solid rgba(0,0,0,0.5)',
            cursor: 'grab',
            zIndex: isSelected ? 10 : 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            color: 'white',
            fontWeight: 'bold',
            pointerEvents: 'auto',
            overflow: 'hidden'
        };

        if (obj.type === 'platform') {
            style.backgroundColor = '#111';
        } else if (obj.type === 'enemy') {
            style.width = 32;
            style.height = 32;
            style.backgroundColor = 
                obj.subType === 'triangle_rapid' ? 'orange' : 
                obj.subType === 'triangle_heavy' ? 'black' : 
                obj.subType === 'triangle_ranged' ? 'cyan' : 'red';
            style.borderRadius = '50%';
        } else if (obj.type === 'start') {
            style.backgroundColor = 'lime';
            style.borderRadius = '50%';
            style.width = 32;
            style.height = 32;
        } else if (obj.type === 'exit') {
            style.border = '2px dashed white';
            style.width = (obj.w || 1) * TILE_SIZE;
            style.height = (obj.h || 1) * TILE_SIZE;
        } else if (obj.type === 'box') {
            style.backgroundColor = '#444';
            style.border = '2px solid #888';
            style.width = 32;
            style.height = 32;
        } else if (obj.type === 'door') {
            style.backgroundColor = '#222';
            style.width = 16;
            style.top = (obj.y - (obj.h || 3) + 1) * TILE_SIZE; 
        } else if (obj.type === 'button') {
             style.backgroundColor = 'red';
             style.height = 10;
             style.top = (obj.y * TILE_SIZE) + 22;
        } else if (obj.type === 'key') {
            style.backgroundColor = 'gold';
            style.borderRadius = '50%';
            style.width = 20;
            style.height = 20;
            style.left = (obj.x * TILE_SIZE) + 6;
            style.top = (obj.y * TILE_SIZE) + 6;
        } else if (obj.type === 'info') {
            style.backgroundColor = 'rgba(0, 150, 255, 0.4)';
            style.border = '1px dashed cyan';
            style.color = 'cyan';
        }

        return (
            <div 
                key={obj.id} 
                style={style}
                onMouseDown={(e) => handleObjectMouseDown(e, obj.id)}
            >
                {obj.type === 'info' ? 'INFO' : obj.type.substring(0,2)}
            </div>
        );
    };

    const selectedObject = objects.find(o => o.id === selectedId);

    return (
        <div className="absolute inset-0 bg-[#222] text-white flex z-[200] overflow-hidden">
            
            {/* LEFT SIDEBAR: LEVEL LIST & TOOLS */}
            <div className="w-56 bg-[#1a1a1a] flex flex-col border-r border-[#333] shrink-0">
                <div className="p-3 border-b border-[#333] font-bold text-sm flex justify-between items-center">
                    <span>CAMPAIGN</span>
                    <button onClick={onBack} className="text-gray-500 hover:text-white text-xs">EXIT</button>
                </div>
                
                {/* Level List */}
                <div className="flex-1 overflow-y-auto border-b border-[#333] p-2 flex flex-col gap-1 max-h-[40vh]">
                    {campaignLevels.map((lvl, idx) => (
                        <div 
                            key={lvl.internalId}
                            onClick={() => handleSwitchLevel(idx)}
                            className={`
                                flex items-center justify-between px-3 py-2 rounded cursor-pointer text-xs
                                ${currentLevelIndex === idx ? 'bg-blue-900 text-white' : 'hover:bg-[#333] text-gray-400'}
                            `}
                        >
                            <span className="truncate flex-1">{idx}: {idx === currentLevelIndex ? levelName : lvl.levelName}</span>
                            <button 
                                onClick={(e) => handleDeleteLevel(idx, e)}
                                className="text-gray-600 hover:text-red-500 ml-2"
                            >
                                x
                            </button>
                        </div>
                    ))}
                    <button onClick={handleAddLevel} className="mt-2 text-xs text-green-500 hover:text-green-400 border border-green-900 rounded py-1 bg-green-900/20">
                        + NEW LEVEL
                    </button>
                </div>

                {/* Tools */}
                <div className="flex-1 overflow-y-auto p-2 gap-2 flex flex-col bg-[#161616]">
                    <div className="text-xs text-gray-500 font-bold mb-1 uppercase">Object Tools</div>
                    <ToolButton label="Select / Move" active={activeTool === null} onClick={() => setActiveTool(null)} />
                    <ToolButton label="Platform" active={activeTool === 'platform'} onClick={() => setActiveTool('platform')} />
                    <ToolButton label="Box" active={activeTool === 'box'} onClick={() => setActiveTool('box')} />
                    <ToolButton label="Key" active={activeTool === 'key'} onClick={() => setActiveTool('key')} />
                    <ToolButton label="Door" active={activeTool === 'door'} onClick={() => setActiveTool('door')} />
                    <ToolButton label="Button" active={activeTool === 'button'} onClick={() => setActiveTool('button')} />
                    <ToolButton label="Exit Portal" active={activeTool === 'exit'} onClick={() => setActiveTool('exit')} />
                    <ToolButton label="Info Point" active={activeTool === 'info'} onClick={() => setActiveTool('info')} />
                    
                    <div className="mt-2 text-xs text-gray-500 font-bold mb-1 uppercase">Enemies</div>
                    <ToolButton label="Basic" active={activeTool === 'enemy' && toolSubType === 'triangle_basic'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_basic'); }} />
                    <ToolButton label="Hunter" active={activeTool === 'enemy' && toolSubType === 'triangle_hunter'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_hunter'); }} />
                    <ToolButton label="Heavy" active={activeTool === 'enemy' && toolSubType === 'triangle_heavy'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_heavy'); }} />
                    <ToolButton label="Ranged" active={activeTool === 'enemy' && toolSubType === 'triangle_ranged'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_ranged'); }} />
                    <ToolButton label="Rapid" active={activeTool === 'enemy' && toolSubType === 'triangle_rapid'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_rapid'); }} />
                </div>
            </div>

            {/* MAIN AREA */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Top Bar */}
                <div className="h-12 bg-[#111] flex items-center justify-between px-4 border-b border-[#333] shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <span className="text-gray-500 text-xs font-mono">ID:{gameLevelId}</span>
                        <input 
                            className="bg-transparent border-b border-gray-500 text-white font-bold focus:outline-none w-48" 
                            value={levelName}
                            onChange={(e) => setLevelName(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2 items-center">
                        <button onClick={handleDownloadCampaign} className="bg-purple-700 px-3 py-1 rounded hover:bg-purple-600 text-xs font-bold whitespace-nowrap">
                            DOWNLOAD CAMPAIGN
                        </button>
                        <button onClick={handleTestPlay} className="bg-green-700 px-4 py-1 rounded hover:bg-green-600 font-bold text-xs whitespace-nowrap">
                            TEST LEVEL
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="flex-1 bg-[#333] overflow-auto relative cursor-crosshair" 
                     ref={canvasRef}
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}
                >
                    <div 
                        className="editor-grid relative bg-[#E8E8E8] shadow-2xl m-8"
                        style={{ 
                            width: mapSize.w * TILE_SIZE, 
                            height: mapSize.h * TILE_SIZE,
                            backgroundImage: 'linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)',
                            backgroundSize: `${TILE_SIZE}px ${TILE_SIZE}px`,
                            pointerEvents: isDragging ? 'none' : 'auto' 
                        }}
                        onClick={handleCanvasClick}
                    >
                        {objects.map(renderObject)}
                    </div>
                </div>
            </div>

            {/* RIGHT PROPERTIES PANEL */}
            <div className="w-64 bg-[#1a1a1a] border-l border-[#333] p-4 flex flex-col gap-4 shrink-0 overflow-y-auto">
                <div className="text-xs text-gray-500 font-bold uppercase">Properties</div>
                
                {selectedObject ? (
                    <div className="flex flex-col gap-3">
                        <div className="text-sm font-bold text-white uppercase border-b border-gray-700 pb-2">
                            {selectedObject.type} <span className="text-xs text-gray-500">#{selectedObject.id.split('_').pop()}</span>
                        </div>
                        
                        <PropInput label="X" value={selectedObject.x} onChange={v => updateObject(selectedObject.id, { x: Number(v) })} />
                        <PropInput label="Y" value={selectedObject.y} onChange={v => updateObject(selectedObject.id, { y: Number(v) })} />

                        {(selectedObject.type === 'platform' || selectedObject.type === 'info') && (
                            <PropInput label="Width (Tiles)" value={selectedObject.w || 1} onChange={v => updateObject(selectedObject.id, { w: Number(v) })} />
                        )}
                        
                        {selectedObject.type === 'platform' && (
                            <PropInput label="Height (Tiles)" value={selectedObject.h || 1} onChange={v => updateObject(selectedObject.id, { h: Number(v) })} />
                        )}

                            {selectedObject.type === 'door' && (
                            <>
                                <PropInput label="Height" value={selectedObject.h || 3} onChange={v => updateObject(selectedObject.id, { h: Number(v) })} />
                                <PropText label="Door ID" value={selectedObject.linkId || ''} onChange={v => updateObject(selectedObject.id, { linkId: v })} />
                            </>
                        )}
                            {selectedObject.type === 'button' && (
                            <>
                                <PropText label="Link To Door ID" value={selectedObject.linkTo || ''} onChange={v => updateObject(selectedObject.id, { linkTo: v })} />
                                <div className="flex flex-col gap-1">
                                    <label className="text-[10px] text-gray-500 uppercase">Behavior</label>
                                    <select 
                                        className="bg-[#111] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-white outline-none"
                                        value={selectedObject.behavior || 'once'}
                                        onChange={(e) => updateObject(selectedObject.id, { behavior: e.target.value as 'hold' | 'once' })}
                                    >
                                        <option value="once">ONCE (Permanent)</option>
                                        <option value="hold">HOLD (Needs Pressure)</option>
                                    </select>
                                </div>
                            </>
                        )}
                        
                        {selectedObject.type === 'info' && (
                            <div className="flex flex-col gap-1">
                                <label className="text-[10px] text-gray-500 uppercase">Message</label>
                                <textarea 
                                    className="bg-[#111] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-white outline-none h-20"
                                    value={selectedObject.text || ''}
                                    onChange={(e) => updateObject(selectedObject.id, { text: e.target.value })}
                                />
                            </div>
                        )}
                        
                        {selectedObject.type === 'exit' && (
                             <PropText label="Target Level ID" value={selectedObject.linkTo || ''} onChange={v => updateObject(selectedObject.id, { linkTo: v })} />
                        )}

                        {selectedObject.type === 'enemy' && (
                            <>
                                <div className="text-xs text-orange-400 mt-2 font-bold">Combat Stats</div>
                                <PropInput label="HP" value={selectedObject.hp || 1} onChange={v => updateObject(selectedObject.id, { hp: Number(v) })} />
                                <PropInput label="Speed" value={selectedObject.speed || 100} onChange={v => updateObject(selectedObject.id, { speed: Number(v) })} />
                            </>
                        )}

                        <button onClick={deleteSelected} className="bg-red-900 text-red-200 py-2 rounded mt-4 text-xs font-bold hover:bg-red-800">DELETE OBJECT (DEL)</button>
                    </div>
                ) : (
                    <div className="text-gray-600 text-sm italic">Select an object to edit properties.</div>
                )}

                <div className="mt-auto border-t border-gray-800 pt-4">
                    <div className="text-xs text-gray-500 font-bold uppercase mb-2">Map Settings</div>
                        <PropInput label="Level ID" value={gameLevelId} onChange={v => setGameLevelId(Number(v))} />
                        <PropInput label="Map Width" value={mapSize.w} onChange={v => setMapSize({ ...mapSize, w: Number(v) })} />
                        <PropInput label="Map Height" value={mapSize.h} onChange={v => setMapSize({ ...mapSize, h: Number(v) })} />
                </div>
            </div>
        </div>
    );
};

const ToolButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button 
        onClick={onClick}
        className={`text-left px-3 py-2 rounded text-xs font-mono transition-colors ${active ? 'bg-white text-black font-bold' : 'text-gray-400 hover:bg-gray-800'}`}
    >
        {label}
    </button>
);

const PropInput = ({ label, value, onChange }: { label: string, value: number, onChange: (val: string) => void }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-500 uppercase">{label}</label>
        <input 
            type="number" 
            className="bg-[#111] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-white outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);

const PropText = ({ label, value, onChange }: { label: string, value: string, onChange: (val: string) => void }) => (
    <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-500 uppercase">{label}</label>
        <input 
            type="text" 
            className="bg-[#111] border border-[#444] rounded px-2 py-1 text-sm text-white focus:border-white outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    </div>
);