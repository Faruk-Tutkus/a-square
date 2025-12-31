
import { GameConfig } from './types';

export const GAME_DATA: GameConfig = {
  "meta": {
    "gameId": "a_squares_life",
    "build": "3.0.0-rapid-update"
  },
  "presentation": {
    "visualStyle": {
      "palette": {
        "background": "#E8E8E8", 
        "foreground": "#111111", 
        "accent": "#555555"      
      }
    }
  },
  "player": {
    "physics": {
      "gravity": 1400, 
      "speed": 300,    
      "jumpForce": 580 
    },
    "health": {
      "max": 1
    },
    "combat": {
      "defaultAmmo": 25
    }
  },
  "levels": [
    {
      "id": 1,
      "name": "Awakening",
      "map": {
        "size": { "w": 80, "h": 20 },
        "platforms": [
            { "x": -5, "y": 14, "w": 25 }, 
            { "x": 24, "y": 12, "w": 5 },  
            { "x": 32, "y": 10, "w": 5 },  
            { "x": 40, "y": 14, "w": 50 }  
        ]
      },
      "infoPoints": [
        { "x": -2, "w": 15, "text": "Use ARROW KEYS to Move" },
        { "x": 8, "w": 20, "text": "Hold SPACE for Higher Jump" }
      ],
      "checkpoints": [{ "x": 5, "y": 10 }],
      "exit": { "to": 2 }
    },
    {
      "id": 2,
      "name": "The Mechanism", 
      "map": {
          "size": { "w": 80, "h": 20 },
          "platforms": [
              { "x": -5, "y": 18, "w": 25 },
              { "x": 20, "y": 18, "w": 60 }
          ]
      },
      "boxes": [
          { "x": 10, "y": 16 } 
      ],
      "buttons": [
          // behavior: 'hold' -> Door opens only while pressed
          { "x": 35, "y": 18, "id": "btn1", "linkToDoorId": "door1", "behavior": "hold" }
      ],
      "doors": [
          { "x": 45, "y": 18, "h": 3, "id": "door1" }
      ],
      "infoPoints": [
        { "x": 15, "w": 20, "text": "Push the box onto the Button to open the Gate." }
      ],
      "exit": { "to": 3 }
    },
    {
      "id": 3,
      "name": "Locked Doors",
      "map": {
        "size": { "w": 100, "h": 20 },
        "platforms": [
            { "x": -5, "y": 14, "w": 30 },
            { "x": 35, "y": 14, "w": 15 }, 
            { "x": 55, "y": 12, "w": 10 },
            { "x": 70, "y": 14, "w": 40 },
            { "x": 40, "y": 8, "w": 5 } 
        ]
      },
      "items": [{ "weapon": "light_gun" }],
      "hasKey": true,
      "keyPos": { "x": 42, "y": 6 },
      "enemies": [
        { "type": "triangle_ranged", "x": 75 }, 
        { "type": "triangle_hunter", "x": 58 }
      ],
      "infoPoints": [
        { "x": -4, "w": 15, "text": "The Portal is locked." },
        { "x": 15, "w": 20, "text": "Find the KEY. Beware of Snipers." }
      ],
      "exit": { "to": 4 }
    },
    {
        "id": 4,
        "name": "Armored Threat",
        "map": {
            "size": { "w": 100, "h": 20 },
            "platforms": [
                { "x": -5, "y": 14, "w": 25 },
                { "x": 30, "y": 14, "w": 40 }, 
                { "x": 75, "y": 14, "w": 30 } 
            ]
        },
        "infoPoints": [{ "x": 10, "w": 20, "text": "Heavy enemies get angry when hit. 5 Shots." }],
        "items": [{ "weapon": "light_gun" }],
        "enemies": [
            { "type": "triangle_heavy", "x": 50 }, 
            { "type": "triangle_ranged", "x": 85 }
        ],
        "exit": { "to": 5 }
    },
    {
      "id": 5,
      "name": "The Gauntlet",
      "map": {
          "size": { "w": 100, "h": 25 }, 
          "platforms": [
              { "x": -5, "y": 20, "w": 120 }, 
              { "x": 15, "y": 17, "w": 5 },
              { "x": 25, "y": 14, "w": 5 },
              { "x": 50, "y": 14, "w": 20 }
          ]
      },
      "items": [{ "weapon": "light_gun" }],
      "buttons": [
          // behavior: 'once' -> Door stays open after one press
          { "x": 60, "y": 14, "id": "btn_final", "linkToDoorId": "door_final", "behavior": "once" }
      ],
      "doors": [
          { "x": 80, "y": 17, "h": 3, "id": "door_final" }
      ],
      "boxes": [
          { "x": 25, "y": 12 }
      ],
      "enemies": [
          { "type": "triangle_heavy", "x": 40 },
          { "type": "triangle_ranged", "x": 90 }
      ],
      "exit": { "to": 6 }
    },
    {
      "id": 6,
      "name": "Bullet Rain",
      "map": {
          "size": { "w": 120, "h": 20 },
          "platforms": [
              { "x": -5, "y": 16, "w": 20 },
              { "x": 20, "y": 16, "w": 40 },
              { "x": 65, "y": 16, "w": 60 }
          ]
      },
      "boxes": [
         { "x": 25, "y": 14 },
         { "x": 35, "y": 14 },
         { "x": 75, "y": 14 }
      ],
      "infoPoints": [
        { "x": 5, "w": 25, "text": "Orange enemies fire in bursts. Take cover." }
      ],
      "items": [{ "weapon": "light_gun" }],
      "enemies": [
          { "type": "triangle_rapid", "x": 50 },
          { "type": "triangle_rapid", "x": 95 },
          { "type": "triangle_heavy", "x": 110 }
      ],
      "exit": { "to": 1 },
      "ending": {
        "message": "The prototype evolves."
      }
    }
  ]
};