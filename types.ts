
export interface GameConfig {
  meta: {
    gameId: string;
    build: string;
  };
  presentation: {
    visualStyle: {
      palette: {
        background: string;
        foreground: string;
        accent: string;
      };
    };
  };
  player: {
    physics: {
      gravity: number;
      speed: number;
      jumpForce: number;
    };
    health: {
      max: number;
    };
    combat: {
      defaultAmmo: number;
    }
  };
  levels: LevelConfig[];
}

export interface EnemyConfig {
  type: 'triangle_basic' | 'triangle_hunter' | 'triangle_heavy' | 'triangle_ranged' | 'triangle_rapid';
  x: number;
  hp?: number;     // Optional custom HP
  speed?: number;  // Optional custom Speed
}

export interface LevelConfig {
  id: number;
  name: string;
  map: {
    size: { w: number; h: number };
    platforms: Array<{ x: number; y: number; w: number; h?: number }>; 
  };
  enemies?: EnemyConfig[];
  items?: Array<{ weapon: string }>;
  
  boxes?: Array<{ x: number; y: number }>;
  
  buttons?: Array<{ x: number; y: number; id: string; linkToDoorId: string; behavior?: 'hold' | 'once' }>;
  doors?: Array<{ x: number; y: number; h: number; id: string }>;

  hasKey?: boolean; 
  keyPos?: { x: number; y: number };
  portalPos?: { x: number; y: number };
  
  checkpoints?: Array<{ x: number; y: number }>;
  infoPoints?: Array<{ x: number; w: number; text: string }>;
  puzzles?: any[];
  exit: { to: number };
  ending?: { message: string };
}

export interface GameState {
  currentLevelId: number;
  status: 'MENU' | 'PLAYING' | 'PAUSED' | 'DIED' | 'VICTORY' | 'EDITOR';
  health: number;
  weapon: string | null;
  ammo: number;
  activeInfo: string | null;
  hasKey: boolean; 
}