import React, { useState, useRef, useEffect } from 'react';
import { LevelConfig } from '../types';

export interface EditorState {
    objects: EditorObject[];
    mapSize: { w: number, h: number };
    levelName: string;
}

interface MapEditorProps {
    initialState?: EditorState;
    onBack: () => void;
    onPlay: (levelData: LevelConfig, editorState: EditorState) => void;
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

export const MapEditor: React.FC<MapEditorProps> = ({ initialState, onBack, onPlay }) => {
    // Canvas State
    const [mapSize, setMapSize] = useState(initialState?.mapSize || { w: 80, h: 25 });
    const [objects, setObjects] = useState<EditorObject[]>(initialState?.objects || [
        { id: 'start', type: 'start', x: 5, y: 10 }
    ]);
    const [levelName, setLevelName] = useState(initialState?.levelName || 'My Custom Level');
    
    // UI State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [activeTool, setActiveTool] = useState<EditorObjectType | null>(null);
    const [toolSubType, setToolSubType] = useState<string>('');
    const [isDragging, setIsDragging] = useState(false);
    
    const canvasRef = useRef<HTMLDivElement>(null);

    // Helpers
    const getNextId = (prefix: string) => `${prefix}_${Date.now()}_${Math.floor(Math.random()*1000)}`;

    const addObject = (x: number, y: number) => {
        if (!activeTool) return;

        // Calculate size first to determine centering
        let initialW = 1;
        let initialH = 1;

        if (activeTool === 'platform') {
            initialW = 5;
            initialH = 1;
        } else if (activeTool === 'door') {
            initialW = 1; 
            initialH = 3;
        } else if (activeTool === 'exit') {
            initialW = 1.5; 
            initialH = 2;
        } else if (activeTool === 'info') {
            initialW = 4;
            initialH = 1;
        }

        // Align center of object to the clicked tile (x,y)
        // Logic: StartX = ClickX - Floor(Width / 2)
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
            newObj.linkTo = '1';
        } else if (activeTool === 'info') {
            newObj.text = "Info text here...";
        }

        setObjects([...objects, newObj]);
        setSelectedId(newObj.id);
    };

    const updateObject = (id: string, updates: Partial<EditorObject>) => {
        setObjects(objects.map(o => o.id === id ? { ...o, ...updates } : o));
    };

    const deleteSelected = () => {
        if (!selectedId) return;
        setObjects(objects.filter(o => o.id !== selectedId));
        setSelectedId(null);
    };

    // Canvas Events
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
        e.stopPropagation(); // Stop bubbling to grid
        setSelectedId(id);
        setIsDragging(true);
    };
    
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && selectedId && canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const mouseX = e.clientX - rect.left + canvasRef.current.scrollLeft;
            const mouseY = e.clientY - rect.top + canvasRef.current.scrollTop;
            
            const obj = objects.find(o => o.id === selectedId);
            if (!obj) return;

            // Convert Mouse Pixel Position directly to Grid Tile Index
            const mouseGridX = Math.floor(mouseX / TILE_SIZE);
            const mouseGridY = Math.floor(mouseY / TILE_SIZE);

            const w = obj.w || 1;
            const h = obj.h || 1;

            // Calculate Top-Left coordinate such that the object is centered on the mouse
            const targetX = mouseGridX - Math.floor(w / 2 + 0.5);
            const targetY = mouseGridY - Math.floor(h / 2 + 0.5);
            
            // Boundary checks
            const clampedX = Math.max(0, Math.min(targetX, mapSize.w - w));
            const clampedY = Math.max(0, Math.min(targetY, mapSize.h - h));

            updateObject(selectedId, { x: clampedX, y: clampedY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Export / Test Logic
    const generateLevelConfig = (): LevelConfig => {
        const platforms = objects.filter(o => o.type === 'platform').map(o => ({ 
            x: o.x, y: o.y, w: o.w || 1, h: o.h || 1 
        }));
        const enemies = objects.filter(o => o.type === 'enemy').map(o => ({ 
            type: o.subType as any, 
            x: o.x,
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
            id: 999, 
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
            exit: { to: 1 }, 
            ending: exitObj ? { message: "Custom Level Complete" } : undefined
        };
    };

    const handleTestPlay = () => {
        const config = generateLevelConfig();
        const state: EditorState = { objects, mapSize, levelName };
        onPlay(config, state);
    };

    const handleDownloadJson = () => {
        const config = generateLevelConfig();
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", levelName.replace(/\s+/g, '_') + ".json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleCopyJson = () => {
        const config = generateLevelConfig();
        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
        alert("JSON copied to clipboard!");
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
        <div className="absolute inset-0 bg-[#222] text-white flex flex-col z-[200] overflow-hidden">
            {/* Header */}
            <div className="h-12 bg-[#111] flex items-center justify-between px-4 border-b border-[#333]">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="bg-gray-700 px-3 py-1 rounded hover:bg-gray-600 text-xs">BACK</button>
                    <input 
                        className="bg-transparent border-b border-gray-500 text-lg font-mono focus:outline-none" 
                        value={levelName}
                        onChange={(e) => setLevelName(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={handleCopyJson} className="bg-blue-900 px-3 py-1 rounded hover:bg-blue-800 text-xs font-mono">COPY JSON</button>
                    <button onClick={handleDownloadJson} className="bg-blue-700 px-3 py-1 rounded hover:bg-blue-600 text-xs font-mono">DOWNLOAD</button>
                    <button onClick={handleTestPlay} className="bg-green-700 px-4 py-1 rounded hover:bg-green-600 font-bold text-xs">TEST LEVEL</button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Tools Sidebar */}
                <div className="w-48 bg-[#1a1a1a] flex flex-col p-2 gap-2 border-r border-[#333] overflow-y-auto">
                    <div className="text-xs text-gray-500 font-bold mb-1 uppercase">Tools</div>
                    <ToolButton label="Select / Move" active={activeTool === null} onClick={() => setActiveTool(null)} />
                    <ToolButton label="Platform" active={activeTool === 'platform'} onClick={() => setActiveTool('platform')} />
                    <ToolButton label="Box" active={activeTool === 'box'} onClick={() => setActiveTool('box')} />
                    <ToolButton label="Key" active={activeTool === 'key'} onClick={() => setActiveTool('key')} />
                    <ToolButton label="Door" active={activeTool === 'door'} onClick={() => setActiveTool('door')} />
                    <ToolButton label="Button" active={activeTool === 'button'} onClick={() => setActiveTool('button')} />
                    <ToolButton label="Exit Portal" active={activeTool === 'exit'} onClick={() => setActiveTool('exit')} />
                    <ToolButton label="Info Point" active={activeTool === 'info'} onClick={() => setActiveTool('info')} />
                    
                    <div className="mt-4 text-xs text-gray-500 font-bold mb-1 uppercase">Enemies</div>
                    <ToolButton label="Basic" active={activeTool === 'enemy' && toolSubType === 'triangle_basic'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_basic'); }} />
                    <ToolButton label="Hunter" active={activeTool === 'enemy' && toolSubType === 'triangle_hunter'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_hunter'); }} />
                    <ToolButton label="Heavy" active={activeTool === 'enemy' && toolSubType === 'triangle_heavy'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_heavy'); }} />
                    <ToolButton label="Ranged" active={activeTool === 'enemy' && toolSubType === 'triangle_ranged'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_ranged'); }} />
                    <ToolButton label="Rapid" active={activeTool === 'enemy' && toolSubType === 'triangle_rapid'} onClick={() => { setActiveTool('enemy'); setToolSubType('triangle_rapid'); }} />
                </div>

                {/* Main Canvas Area */}
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
                            pointerEvents: isDragging ? 'none' : 'auto' // Prevent grid clicks when dragging
                        }}
                        onClick={handleCanvasClick}
                    >
                        {objects.map(renderObject)}
                    </div>
                </div>

                {/* Properties Panel */}
                <div className="w-64 bg-[#1a1a1a] border-l border-[#333] p-4 flex flex-col gap-4">
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

                            {selectedObject.type === 'enemy' && (
                                <>
                                    <div className="text-xs text-orange-400 mt-2 font-bold">Combat Stats</div>
                                    <PropInput label="HP" value={selectedObject.hp || 1} onChange={v => updateObject(selectedObject.id, { hp: Number(v) })} />
                                    <PropInput label="Speed" value={selectedObject.speed || 100} onChange={v => updateObject(selectedObject.id, { speed: Number(v) })} />
                                </>
                            )}

                            <button onClick={deleteSelected} className="bg-red-900 text-red-200 py-2 rounded mt-4 text-xs font-bold hover:bg-red-800">DELETE OBJECT</button>
                        </div>
                    ) : (
                        <div className="text-gray-600 text-sm italic">Select an object to edit properties.</div>
                    )}

                    <div className="mt-auto border-t border-gray-800 pt-4">
                        <div className="text-xs text-gray-500 font-bold uppercase mb-2">Map Settings</div>
                         <PropInput label="Map Width" value={mapSize.w} onChange={v => setMapSize({ ...mapSize, w: Number(v) })} />
                         <PropInput label="Map Height" value={mapSize.h} onChange={v => setMapSize({ ...mapSize, h: Number(v) })} />
                    </div>
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